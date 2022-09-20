import { Button, styled, Text } from '@nextui-org/react';
import type { NextPage } from 'next';

const Container = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '5rem 1rem',
});

const Home: NextPage = () => {
  return (
    <Container>
      <Text h1>Effortlessly backup your repositories</Text>
      <Text h4>Built on top of IPFS and Arweave</Text>
      <Button
        shadow
        css={{
          marginTop: '2rem',
          fontSize: '$xl',
          fontWeight: '$bold',
        }}
        color="gradient"
      >
        Sign-in with GitHub
      </Button>
    </Container>
  );
};

export default Home;
