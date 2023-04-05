import type { AppProps } from "next/app";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  // This is the chain your dApp will work on.
  const activeChain = "mumbai";

  return (
    <ThirdwebProvider
      authConfig={{
        domain: process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN as string,
      }}
      activeChain={activeChain}
    >
      <Component {...pageProps} />
    </ThirdwebProvider>
  );
}

export default MyApp;
