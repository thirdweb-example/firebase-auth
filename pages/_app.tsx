import type { AppProps } from "next/app";
import { ChainId, ThirdwebProvider } from "@thirdweb-dev/react";
import "../styles/globals.css";

// This is the chainId your dApp will work on.
const activeChainId = ChainId.Mumbai;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider
      desiredChainId={activeChainId}
      authConfig={{
        // The backend URL of the authentication endoints.
        authUrl: "/api/thirdweb-auth",
        // Set this to your domain to prevent signature malleability attacks.
        domain: process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN!,
      }}
    >
      <Component {...pageProps} />
    </ThirdwebProvider>
  );
}

export default MyApp;
