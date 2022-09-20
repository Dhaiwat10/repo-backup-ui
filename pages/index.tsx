import {
  Button,
  Divider,
  Grid,
  Input,
  Modal,
  styled,
  StyledDivider,
  Table,
  Text,
} from '@nextui-org/react';
import type { NextPage } from 'next';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { GITHUB_APP_INSTALLATION_PAGE_URL } from '../lib/github';

const Container = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '5rem 1rem',
});

interface SearchResult {
  id: string;
  created_at: string;
  repo_owner: string;
  repo_name: string;
  backup_cid: string;
}

const Home: NextPage = () => {
  const { data: session } = useSession();

  const [searchRepoOwner, setSearchRepoOwner] = useState('');
  const [searchRepoName, setSearchRepoName] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    // look for the 'success' query param, if it is 'true' then set showSuccessModal to true
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setShowSuccessModal(true);
    }
  }, []);

  const goToInstallationPage = () => {
    window.location.href = GITHUB_APP_INSTALLATION_PAGE_URL;
  };

  const handleSearch = async () => {
    const res = await fetch(
      `/api/db-query?repo_owner=${searchRepoOwner}&repo_name=${searchRepoName}`
    );
    const data = await res.json();
    console.log(data);
    setSearchResults(data.backups);
  };

  const handleSuccesModalClose = () => {
    setShowSuccessModal(false);
  };

  return (
    <Container>
      <Modal
        closeButton
        blur
        open={showSuccessModal}
        onClose={handleSuccesModalClose}
      >
        <Modal.Header>
          <Text h4>Success! 🎉</Text>
        </Modal.Header>
        <Modal.Body>
          <Text>
            Your account has been successfully connected. Each time you push
            some code, a backup of your repository will be automatically created
            &amp; stored on IPFS.
          </Text>
        </Modal.Body>
      </Modal>

      <Text h1>Effortlessly backup your repositories</Text>
      <Text h4>Built on top of IPFS, Filecoin and web3.storage</Text>

      {session ? (
        <div>
          <Text h3>Logged in as {session?.user?.email}</Text>
          <Button onClick={() => signOut()}>Sign out</Button>
        </div>
      ) : (
        <Button
          onClick={goToInstallationPage}
          shadow
          css={{
            marginTop: '2rem',
            fontSize: '$xl',
            fontWeight: '$bold',
          }}
          color="gradient"
        >
          Get started
        </Button>
      )}

      <Divider
        css={{
          my: '$16',
        }}
      />

      <Text h4>Search for existing backups</Text>

      <Grid
        css={{
          gridColumnGap: '$16',
        }}
      >
        <Input
          label="Repo owner's username"
          placeholder="Repository owner"
          value={searchRepoOwner}
          onChange={(e) => setSearchRepoOwner(e.target.value)}
        />

        <Input
          label="Repository name"
          placeholder="Repository name"
          value={searchRepoName}
          onChange={(e) => setSearchRepoName(e.target.value)}
        />
      </Grid>

      <Button onClick={handleSearch} css={{ w: 'fit-content' }}>
        Search
      </Button>

      {searchResults.length > 0 && (
        <Table>
          <Table.Header>
            <Table.Column>REPO NAME</Table.Column>
            <Table.Column>IPFS BACKUP</Table.Column>
          </Table.Header>
          <Table.Body>
            {searchResults.map((result) => (
              <Table.Row key={result.id}>
                <Table.Cell>
                  {result.repo_owner}/{result.repo_name}
                </Table.Cell>
                <Table.Cell>
                  <a
                    href={`https://ipfs.filebase.io/ipfs/${result.backup_cid}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {result.backup_cid}
                  </a>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  );
};

export default Home;
