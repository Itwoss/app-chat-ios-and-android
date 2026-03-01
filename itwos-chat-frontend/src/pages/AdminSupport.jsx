import { Container } from '@chakra-ui/react';
import AdminSupportManagement from '../components/Admin/AdminSupportManagement';
import AdminLayout from '../components/Admin/AdminLayout';

const AdminSupportPage = () => {
  return (
    <AdminLayout>
      <Container maxW="7xl" py={8}>
        <AdminSupportManagement />
      </Container>
    </AdminLayout>
  );
};

export default AdminSupportPage;


