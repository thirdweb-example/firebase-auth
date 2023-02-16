import { NextApiRequest, NextApiResponse } from "next";
import { verifyLogin } from "@thirdweb-dev/auth/evm";
import initializeFirebaseServer from "../../../lib/initFirebaseAdmin";

export default async function login(req: NextApiRequest, res: NextApiResponse) {
  // Grab the login payload the user sent us with their request.
  const payload = req.body.payload;

  const { address, error } = await verifyLogin(
    process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN as string,
    payload
  );
  if (!address) {
    return res.status(401).json({ error });
  }

  // Initialize the Firebase Admin SDK.
  const { auth } = initializeFirebaseServer();

  // Generate a JWT token for the user to be used on the client-side.
  const token = await auth.createCustomToken(address);

  // Send the token to the client-side.
  return res.status(200).json({ token });
}
