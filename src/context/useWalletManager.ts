import { useEffect, useRef, useState } from 'react';
import { WalletManager } from 'xrpl-connect';

function useWalletManager(adapters, network = 'testnet') {
  const [walletManager, setWalletManager] = useState(null);
  const [account, setAccount] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const connectorRef = useRef(null);
  const managerRef = useRef(null); // ✅ store the same manager across renders

  useEffect(() => {
    let isMounted = true;
    let attached = false;

    // Create WalletManager only once
    if (!managerRef.current) {
      managerRef.current = new WalletManager({
        adapters,
        network,
        autoConnect: false,
      });
    }
    const manager = managerRef.current;

    // Register events once
    manager.on('connect', (acc) => {
      if (!isMounted) return;
      setAccount(acc);
      setConnected(true);
      setError(null);
    });

    manager.on('disconnect', () => {
      if (!isMounted) return;
      setAccount(null);
      setConnected(false);
    });

    manager.on('error', (err) => {
      if (!isMounted) return;
      setError(err);
    });

    // ---- Attempt to attach until success ----
    const tryAttach = () => {
      const el = connectorRef.current;
      if (!el || typeof el.setWalletManager !== 'function') return false;

      try {
        el.setWalletManager(manager);
        setWalletManager(manager);
        setLoading(false);
        attached = true;
        console.log('✅ WalletManager attached successfully.');
        return true;
      } catch (err) {
        console.warn('⚠️ Failed to attach WalletManager once:', err);
        return false;
      }
    };

    const interval = setInterval(() => {
      if (attached || !isMounted) {
        clearInterval(interval);
        return;
      }
      tryAttach();
    }, 300);

    // Clean up
    return () => {
      isMounted = false;
      clearInterval(interval);
      // Don’t destroy the manager on every re-render — only on unmount
      //manager.disconnect().catch(() => {});
    };
  }, []); // ✅ empty deps → never re-run, stable

  const disconnect = async () => {
    if (managerRef.current) await managerRef.current.disconnect();
  };

  return {
    walletManager,
    account,
    connected,
    error,
    loading,
    connectorRef,
    disconnect,
  };
}

export default useWalletManager;
