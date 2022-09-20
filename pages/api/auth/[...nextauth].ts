import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';

export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET as string,
  callbacks: {
    jwt: async ({ token, user, account, profile }) => {
      if (user && account && account.provider === 'github') {
        token.username = profile?.login; // save the github username
        token.githubAccessToken = account.access_token; // get the github accessToken from the user who signed in
      }

      return Promise.resolve(token);
    },
  },
});
