import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/core';

export const getOctokitInstance = (installationId: number) => {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID as string,
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY as string,
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      installationId,
    },
  });
};
