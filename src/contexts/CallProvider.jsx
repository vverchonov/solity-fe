import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Web } from 'sip.js';
import axios from 'axios';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const SERVER_URL = 'wss://rdx.narayana.im:8089/ws';
const DOMAIN_URL = 'rdx.narayana.im';
const DISPLAY_NAME = 'LettoDev';
const BACKEND_URL = 'https://api.sipcallers.com';

const CallContext = createContext(undefined);

export const useCall = () => {
    const context = useContext(CallContext);
    if (context === undefined) {
        throw new Error('useCall must be used within a CallProvider');
    }
    return context;
};

export const CallProvider = ({ children }) => {
    const { publicKey, connect, disconnect: walletDisconnect, connected } = useWallet();
    const { connection } = useConnection();

    const [callConfig, setCallConfig] = useState({
        username: '',
        password: '',
    });

    const [callState, setCallState] = useState({
        isConnected: false,
        isRegistered: false,
        currentCall: null,
        callStatus: 'idle', // 'idle' | 'connecting' | 'calling' | 'in-call' | 'incoming'
        remoteNumber: '',
        isMuted: false,
        isOnHold: false
    });

    const [logs, setLogs] = useState([]);
    const [walletBalance, setWalletBalance] = useState(0);
    const simpleUserRef = useRef(null);

    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
    };

    const getAudioElement = (id) => {
        const el = document.getElementById(id);
        if (!(el instanceof HTMLAudioElement)) {
            throw new Error(`Element "${id}" not found or not an audio element.`);
        }
        return el;
    };

    const connectToServer = async () => {
        try {
            addLog('Connecting to server...');

            const options = {
                aor: `sip:${callConfig.username}@${DOMAIN_URL}`,
                media: {
                    constraints: { audio: true, video: false },
                    remote: { audio: getAudioElement('remoteAudio') }
                },
                userAgentOptions: {
                    authorizationUsername: callConfig.username,
                    authorizationPassword: callConfig.password,
                    displayName: DISPLAY_NAME
                }
            };

            const simpleUser = new Web.SimpleUser(SERVER_URL, options);
            simpleUserRef.current = simpleUser;

            // Set up event handlers
            simpleUser.delegate = {
                onCallReceived: () => {
                    addLog('Incoming call received');
                    setCallState(prev => ({ ...prev, callStatus: 'incoming' }));
                },
                onCallAnswered: () => {
                    addLog('Call answered');
                    setCallState(prev => ({ ...prev, callStatus: 'in-call' }));
                },
                onCallHangup: () => {
                    addLog('Call ended');
                    setCallState(prev => ({
                        ...prev,
                        callStatus: 'idle',
                        currentCall: null,
                        isMuted: false,
                        isOnHold: false
                    }));
                },
                onCallHold: (held) => {
                    addLog(held ? 'Call put on hold' : 'Call resumed from hold');
                    setCallState(prev => ({ ...prev, isOnHold: held }));
                },
                onRegistered: () => {
                    addLog('Successfully registered with server');
                    setCallState(prev => ({ ...prev, isRegistered: true }));
                },
                onUnregistered: () => {
                    addLog('Unregistered from server');
                    setCallState(prev => ({ ...prev, isRegistered: false }));
                },
                onServerConnect: () => {
                    addLog('Connected to server');
                    setCallState(prev => ({ ...prev, isConnected: true }));
                },
                onServerDisconnect: () => {
                    addLog('Disconnected from server');
                    setCallState(prev => ({
                        ...prev,
                        isConnected: false,
                        isRegistered: false,
                        callStatus: 'idle',
                        currentCall: null
                    }));
                }
            };

            await simpleUser.connect();
            await simpleUser.register();
            setCallState(prev => ({ ...prev, currentCall: simpleUser }));

        } catch (error) {
            addLog(`Connection failed: ${error}`);
            console.error('Connection failed:', error);
        }
    };

    const disconnect = async () => {
        if (simpleUserRef.current) {
            try {
                await simpleUserRef.current.disconnect();
                addLog('Disconnected from server');
            } catch (error) {
                addLog(`Disconnect error: ${error}`);
            }
            simpleUserRef.current = null;
        }
    };

    const updateCallerID = async (callerID) => {
        if (!callerID) return false;
        try {
            await axios.post(`${BACKEND_URL}/updateExtension?id=${callConfig.username}`, {
                callerID: callerID
            });
            addLog(`Caller ID updated to ${callerID}`);
            return true;
        } catch (error) {
            addLog(`Failed to update Caller ID: ${error}`);
            return false;
        }
    };

    const makeCall = async (targetNumber, callerID) => {
        if (!simpleUserRef.current || !targetNumber || !callerID) {
            addLog('Cannot make call: not connected or no target number/caller ID set');
            return;
        }

        try {
            addLog(`Setting Caller ID to ${callerID}`);
            const ok = await updateCallerID(callerID);
            if (!ok) {
                addLog('Call aborted due to Caller ID update failure');
                return;
            }

            addLog(`Calling ${targetNumber}...`);
            setCallState(prev => ({ ...prev, callStatus: 'calling', remoteNumber: targetNumber }));

            const target = `sip:${targetNumber}@${DOMAIN_URL}`;
            await simpleUserRef.current.call(target);

        } catch (error) {
            addLog(`Call failed: ${error}`);
            setCallState(prev => ({ ...prev, callStatus: 'idle', remoteNumber: '' }));
        }
    };

    const hangupCall = async () => {
        if (simpleUserRef.current) {
            try {
                await simpleUserRef.current.hangup();
                addLog('Call hung up');
            } catch (error) {
                addLog(`Hangup error: ${error}`);
            }
        }
    };

    const answerCall = async () => {
        if (simpleUserRef.current) {
            try {
                await simpleUserRef.current.answer();
                addLog('Call answered');
            } catch (error) {
                addLog(`Answer error: ${error}`);
            }
        }
    };

    const toggleMute = async () => {
        if (simpleUserRef.current) {
            try {
                if (callState.isMuted) {
                    simpleUserRef.current.unmute();
                    addLog('Call unmuted');
                } else {
                    simpleUserRef.current.mute();
                    addLog('Call muted');
                }
                setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
            } catch (error) {
                addLog(`Mute toggle error: ${error}`);
            }
        }
    };

    const toggleHold = async () => {
        if (simpleUserRef.current) {
            try {
                if (callState.isOnHold) {
                    await simpleUserRef.current.unhold();
                    addLog('Call resumed');
                } else {
                    await simpleUserRef.current.hold();
                    addLog('Call put on hold');
                }
                setCallState(prev => ({ ...prev, isOnHold: !prev.isOnHold }));
            } catch (error) {
                addLog(`Hold toggle error: ${error}`);
            }
        }
    };

    const sendDTMF = (digit) => {
        if (simpleUserRef.current && callState.callStatus === 'in-call') {
            try {
                simpleUserRef.current.sendDTMF(digit);
                addLog(`DTMF sent: ${digit}`);
            } catch (error) {
                addLog(`DTMF error: ${error}`);
            }
        }
    };

    // Wallet functions
    const connectWallet = async () => {
        try {
            await connect();
            addLog('Wallet connected');
        } catch (error) {
            addLog(`Wallet connection failed: ${error}`);
        }
    };

    const disconnectWallet = async () => {
        try {
            await walletDisconnect();
            addLog('Wallet disconnected');
            setWalletBalance(0);
        } catch (error) {
            addLog(`Wallet disconnect failed: ${error}`);
        }
    };

    const refreshWalletBalance = useCallback(async () => {
        if (!publicKey || !connection) return;

        try {
            const balance = await connection.getBalance(publicKey);
            const solBalance = balance / LAMPORTS_PER_SOL;
            setWalletBalance(solBalance);
            addLog(`Wallet balance: ${solBalance.toFixed(4)} SOL`);
        } catch (error) {
            addLog(`Failed to fetch wallet balance: ${error}`);
        }
    }, [publicKey, connection]);

    // Update wallet balance when connected
    useEffect(() => {
        if (connected && publicKey) {
            refreshWalletBalance();
        } else {
            setWalletBalance(0);
        }
    }, [connected, publicKey, connection, refreshWalletBalance]);

    useEffect(() => {
        return () => {
            if (simpleUserRef.current) {
                simpleUserRef.current.disconnect();
            }
        };
    }, []);

    const value = {
        callConfig,
        setCallConfig,
        callState,
        logs,
        connectToServer,
        disconnect,
        makeCall,
        hangupCall,
        answerCall,
        toggleMute,
        toggleHold,
        sendDTMF,
        addLog,
        // Wallet functionality
        walletAddress: publicKey?.toString() || null,
        walletBalance,
        isWalletConnected: connected,
        connectWallet,
        disconnectWallet,
        refreshWalletBalance
    };

    return (
        <CallContext.Provider value={value}>
            {children}
            {/* Audio element for remote audio - required for sip.js */}
            <audio id="remoteAudio" autoPlay playsInline style={{ display: 'none' }} />
        </CallContext.Provider>
    );
};