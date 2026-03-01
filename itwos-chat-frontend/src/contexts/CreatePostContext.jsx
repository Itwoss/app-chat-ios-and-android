import { createContext, useContext, useState, useCallback } from 'react';

const CreatePostContext = createContext(null);

export const CreatePostProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditPostOpen, setIsEditPostOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState(null);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openEditPostModal = useCallback((post) => {
    setPostToEdit(post || null);
    setIsEditPostOpen(true);
  }, []);

  const closeEditPostModal = useCallback(() => {
    setIsEditPostOpen(false);
    setPostToEdit(null);
  }, []);

  const value = {
    isOpen,
    openModal,
    closeModal,
    isEditPostOpen,
    postToEdit,
    openEditPostModal,
    closeEditPostModal,
  };

  return (
    <CreatePostContext.Provider value={value}>
      {children}
    </CreatePostContext.Provider>
  );
};

export const useCreatePost = () => {
  const context = useContext(CreatePostContext);
  if (!context) {
    // Return a default context if not provided (for backward compatibility)
    return {
      isOpen: false,
      openModal: () => {},
      closeModal: () => {},
      isEditPostOpen: false,
      postToEdit: null,
      openEditPostModal: () => {},
      closeEditPostModal: () => {},
    };
  }
  return context;
};






