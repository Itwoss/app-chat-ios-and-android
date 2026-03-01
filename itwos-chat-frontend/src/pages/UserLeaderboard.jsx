import { Box, Container } from '@chakra-ui/react';
import LeaderboardView from '../components/Leaderboard/LeaderboardView';

const UserLeaderboard = () => {
  return (
    <Container maxW="6xl" py={8}>
      <Box>
        <LeaderboardView />
      </Box>
    </Container>
  );
};

export default UserLeaderboard;

