import { useSyncExternalStore } from 'react';

const getWindowWidth = () => {
  return window.innerWidth;
};

const getWindowHeight = () => {
  return window.innerHeight;
};

const subscribeWindowSizeChange = (callback: () => void) => {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
};

export const useWindowWidth = (): number => {
  return useSyncExternalStore(subscribeWindowSizeChange, getWindowWidth);
};

export const useWindowHeight = (): number => {
  return useSyncExternalStore(subscribeWindowSizeChange, getWindowHeight);
};
