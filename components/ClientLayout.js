"use client";
import LogoutOnClose from './LogoutOnClose';

/**
 * ClientLayout Component
 * Wrapper component for client-side features that need to be in the root layout
 */
export default function ClientLayout({ children }) {
  return (
    <>
      <LogoutOnClose />
      {children}
    </>
  );
}
