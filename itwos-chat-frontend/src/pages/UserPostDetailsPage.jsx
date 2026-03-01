import { Box, VStack, Text, Button, useColorModeValue, Center } from '@chakra-ui/react';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useGetPostQuery, useGetCurrentUserQuery } from '../store/api/userApi';
import PostDetailsSheet from '../components/Posts/PostDetailsSheet';
import { PostDetailsSkeleton } from '../components/Skeletons';

export default function UserPostDetailsPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const postFromState = location.state?.post;

  const { data: currentUser } = useGetCurrentUserQuery();
  const { data: fetchedPost, isLoading: isLoadingPost } = useGetPostQuery(postId, { skip: !!postFromState });
  const post = postFromState || fetchedPost?.data || fetchedPost;

  const [sheetOpen, setSheetOpen] = useState(true);
  const bg = useColorModeValue('#fff', '#000');
  const textColor = useColorModeValue('#262626', '#fafafa');

  const closeSheet = () => setSheetOpen(false);
  useEffect(() => {
    if (!sheetOpen) {
      const t = setTimeout(() => navigate(-1), 280);
      return () => clearTimeout(t);
    }
  }, [sheetOpen, navigate]);

  if (!postFromState && isLoadingPost) {
    return (
      <Center minH="100vh" bg={bg}>
        <Box maxW="500px" w="100%" px={4}>
          <PostDetailsSkeleton />
        </Box>
      </Center>
    );
  }

  if (!post) {
    return (
      <Center minH="100vh" bg={bg}>
        <VStack>
          <Text color={textColor}>Post not found</Text>
          <Button variant="ghost" color={textColor} leftIcon={<ArrowLeft size={18} />} onClick={() => navigate(-1)}>
            Go back
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <PostDetailsSheet
      post={post}
      isOpen={sheetOpen}
      onClose={closeSheet}
    />
  );
}
