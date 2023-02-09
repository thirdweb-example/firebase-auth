import { NextApiRequest, NextApiResponse } from "next";
import initializeFirebaseServer from "../../../lib/initFirebaseAdmin";
import { getUser } from "../thirdweb-auth/[...thirdweb]";

export default async function login(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUser(req);

  if (!user) return res.status(401).json({ error: "Unauthorized!" });

  // Initialize the Firebase Admin SDK.
  const { auth } = initializeFirebaseServer();

  // Generate a JWT token for the user to be used on the client-side.
  const token = await auth.createCustomToken(user?.address);

  // Send the token to the client-side.
  return res.status(200).json({ token });
}
