// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import { getFilesFromPath, Filelike, Web3Storage } from 'web3.storage';
import fetch from 'node-fetch';
import { supabase } from '../../lib/supabase';
import { getOctokitInstance } from '../../lib/github';

type Data = {
  name: string;
};

const web3StorageClient = new Web3Storage({
  token: process.env.WEB3_STORAGE_TOKEN as string,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  console.log(req.headers['x-github-event']);
  const eventType = req.headers['x-github-event'];

  if (eventType === 'push') {
    // backup the code to IPFS
    const repoOwner = (req.body.repository.owner.name as string).toLowerCase();
    const repoName = (req.body.repository.name as string).toLowerCase();
    const installationId = req.body.installation.id;

    const repoContents = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/zipball`
    );

    const repoBuffer = await repoContents.buffer();
    fs.writeFileSync('./repo.zip', repoBuffer);

    // log the newly created zip file's size in megabytes
    const stats = fs.statSync('./repo.zip');
    const fileSizeInMegabytes = stats.size / 1000000.0;
    console.debug(`repo.zip size: ${fileSizeInMegabytes} MB`);

    const files = await getFilesFromPath('./repo.zip');
    const cid = await web3StorageClient.put(files as Iterable<Filelike>);

    console.log(`Successfully backed up to IPFS: ${cid}`);

    // TODO: save to DB
    const { error: dbError } = await supabase.from('backups').insert([
      {
        repo_owner: repoOwner,
        repo_name: repoName,
        backup_cid: cid,
      },
    ]);

    console.log({
      dbError,
    });

    // TODO: create deployment using github API
    const octokit = getOctokitInstance(installationId);
    const { data } = await octokit.request(
      'POST /repos/{owner}/{repo}/deployments',
      {
        owner: repoOwner,
        repo: repoName,
        ref: 'main',
        payload: JSON.stringify({
          backup_cid: cid,
        }),
        description: 'Backup deployment',
        task: 'deploy',
      }
    );

    // @ts-expect-error
    const deploymentId = data.id;

    await octokit.request(
      'POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses',
      {
        owner: repoOwner,
        repo: repoName,
        deployment_id: deploymentId,
        state: 'success',
        target_url: `https://ipfs.filebase.io/ipfs/${cid}`,
        log_url: `https://ipfs.filebase.io/ipfs/${cid}`,
      }
    );
  }

  res.status(200).json({ name: 'John Doe' });
}
