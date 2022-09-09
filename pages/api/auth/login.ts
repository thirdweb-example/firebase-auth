import { NextApiRequest, NextApiResponse } from "next";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import initializeFirebaseServer from "../../../lib/initFirebaseAdmin";

export default async function login(req: NextApiRequest, res: NextApiResponse) {
  // Grab the login payload the user sent us with their request.
  const loginPayload = req.body.payload;
  // Set this to your domain to prevent signature malleability attacks.
  const domain = "http://localhost:3000";

  const sdk = ThirdwebSDK.fromPrivateKey(
    // Using environment variables to secure your private key is a security vulnerability.
    // Learn how to store your private key securely:
    // https://portal.thirdweb.com/sdk/set-up-the-sdk/securing-your-private-key
    process.env.ADMIN_PRIVATE_KEY!,
    "mumbai" // configure this to your network
  );

  let address;
  try {
    // Verify the address of the logged in client-side wallet by validating the provided client-side login request.
    address = sdk.auth.verify(domain, loginPayload);
  } catch (err) {
    // If the login request is invalid, return an error.
    console.error(err);
    return res.status(401).send("Unauthorized");
  }

  // Initialize the Firebase Admin SDK.
  const { auth } = initializeFirebaseServer();

  // Generate a JWT token for the user to be used on the client-side.
  const token = await auth.createCustomToken(address);

  // Send the token to the client-side.
  return res.status(200).json({ token });
}
