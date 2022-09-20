import { Button, styled, Text } from '@nextui-org/react';
import type { NextPage } from 'next';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

const Container = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '5rem 1rem',
});

const Home: NextPage = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const goToSignInPage = () => {
    router.push('/api/auth/signin');
  };

  return (
    <Container>
      <Text h1>Effortlessly backup your repositories</Text>
      <Text h4>Built on top of IPFS and Arweave</Text>

      {session ? (
        <div>
          <Text h3>Logged in as {session?.user?.email}</Text>
          <Button onClick={() => signOut()}>Sign out</Button>
        </div>
      ) : (
        <Button
          onClick={goToSignInPage}
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
    </Container>
  );
};

export default Home;
