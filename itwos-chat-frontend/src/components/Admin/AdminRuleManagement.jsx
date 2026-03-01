import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Switch,
  Input,
  NumberInput,
  NumberInputField,
  FormControl,
  FormLabel,
  Card,
  CardBody,
  useColorModeValue,
  Divider,
  useToast,
  Spinner,
  SimpleGrid,
  Select,
} from '@chakra-ui/react';
import { Save, Settings } from 'lucide-react';
import { useState } from 'react';
import {
  useGetRulesQuery,
  useUpdateRulesMutation,
  useToggleRuleMutation,
} from '../../store/api/adminRuleApi';

const AdminRuleManagement = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const toast = useToast();
  const { data, isLoading } = useGetRulesQuery();
  const [updateRules] = useUpdateRulesMutation();
  const [toggleRule] = useToggleRuleMutation();

  const [rules, setRules] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize rules from query data
  if (data?.success && data?.data && !rules) {
    setRules(data.data);
  }

  const handleToggle = async (enabled) => {
    try {
      await toggleRule({ enabled }).unwrap();
      toast({
        title: 'Success',
        description: `Count system ${enabled ? 'enabled' : 'disabled'}`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to toggle rule',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      await updateRules(rules).unwrap();
      toast({
        title: 'Success',
        description: 'Rules updated successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to update rules',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateNestedField = (path, value) => {
    setRules((prev) => {
      const newRules = { ...prev };
      const keys = path.split('.');
      let current = newRules;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newRules;
    });
  };

  if (isLoading || !rules) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <HStack spacing={2}>
            <Settings size={24} />
            <Text fontSize="xl" fontWeight="bold" color={textColor}>
              Count System Rules
            </Text>
          </HStack>
          <Button
            leftIcon={<Save size={16} />}
            colorScheme="blue"
            onClick={handleUpdate}
            isLoading={isSaving}
          >
            Save Changes
          </Button>
        </HStack>

        {/* Enable/Disable Toggle */}
        <Card bg={bgColor} border="1px" borderColor={borderColor}>
          <CardBody>
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium" color={textColor}>
                  Enable Count System
                </Text>
                <Text fontSize="sm" color={textColor} opacity={0.7}>
                  Turn the entire count system on or off
                </Text>
              </VStack>
              <Switch
                isChecked={rules.enabled}
                onChange={(e) => handleToggle(e.target.checked)}
                colorScheme="blue"
                size="lg"
              />
            </HStack>
          </CardBody>
        </Card>

        {/* Chat Rules */}
        <Card bg={bgColor} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                Chat Rules
              </Text>

              <FormControl>
                <FormLabel color={textColor}>Daily Limit per User Pair</FormLabel>
                <NumberInput
                  value={rules.chatDailyLimit}
                  onChange={(_, value) => setRules({ ...rules, chatDailyLimit: value })}
                  min={1}
                >
                  <NumberInputField />
                </NumberInput>
                <Text fontSize="xs" color={textColor} opacity={0.7} mt={1}>
                  Maximum count per day for chatting with the same user
                </Text>
              </FormControl>

              <FormControl>
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <FormLabel mb={0} color={textColor}>
                      Require Different Text
                    </FormLabel>
                    <Text fontSize="xs" color={textColor} opacity={0.7}>
                      Prevent duplicate message counting
                    </Text>
                  </VStack>
                  <Switch
                    isChecked={rules.chatRequireDifferentText}
                    onChange={(e) =>
                      setRules({ ...rules, chatRequireDifferentText: e.target.checked })
                    }
                    colorScheme="blue"
                  />
                </HStack>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* Media Rules */}
        <Card bg={bgColor} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                Media Rules
              </Text>

              <FormControl>
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <FormLabel mb={0} color={textColor}>
                      Prevent Image Reuse
                    </FormLabel>
                    <Text fontSize="xs" color={textColor} opacity={0.7}>
                      Don't count reused images
                    </Text>
                  </VStack>
                  <Switch
                    isChecked={rules.preventImageReuse}
                    onChange={(e) =>
                      setRules({ ...rules, preventImageReuse: e.target.checked })
                    }
                    colorScheme="blue"
                  />
                </HStack>
              </FormControl>

              <FormControl>
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <FormLabel mb={0} color={textColor}>
                      Prevent Audio Reuse
                    </FormLabel>
                    <Text fontSize="xs" color={textColor} opacity={0.7}>
                      Don't count reused audio
                    </Text>
                  </VStack>
                  <Switch
                    isChecked={rules.preventAudioReuse}
                    onChange={(e) =>
                      setRules({ ...rules, preventAudioReuse: e.target.checked })
                    }
                    colorScheme="blue"
                  />
                </HStack>
              </FormControl>

              <FormControl>
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <FormLabel mb={0} color={textColor}>
                      Prevent Emoji Reuse
                    </FormLabel>
                    <Text fontSize="xs" color={textColor} opacity={0.7}>
                      Don't count reused emojis
                    </Text>
                  </VStack>
                  <Switch
                    isChecked={rules.preventEmojiReuse}
                    onChange={(e) =>
                      setRules({ ...rules, preventEmojiReuse: e.target.checked })
                    }
                    colorScheme="blue"
                  />
                </HStack>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* Friday Multiplier */}
        <Card bg={bgColor} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                Friday Multiplier
              </Text>

              <FormControl>
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <FormLabel mb={0} color={textColor}>
                      Enable Friday Multiplier
                    </FormLabel>
                    <Text fontSize="xs" color={textColor} opacity={0.7}>
                      Double counts on Fridays
                    </Text>
                  </VStack>
                  <Switch
                    isChecked={rules.fridayMultiplier?.enabled}
                    onChange={(e) =>
                      updateNestedField('fridayMultiplier.enabled', e.target.checked)
                    }
                    colorScheme="blue"
                  />
                </HStack>
              </FormControl>

              {rules.fridayMultiplier?.enabled && (
                <FormControl>
                  <FormLabel color={textColor}>Multiplier Value</FormLabel>
                  <NumberInput
                    value={rules.fridayMultiplier?.multiplier || 2}
                    onChange={(_, value) =>
                      updateNestedField('fridayMultiplier.multiplier', value)
                    }
                    min={1}
                    max={10}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Milestone Rewards */}
        <Card bg={bgColor} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                Milestone Rewards
              </Text>

              <Divider />

              <VStack spacing={4} align="stretch">
                <Text fontSize="md" fontWeight="medium" color={textColor}>
                  Likes Milestone
                </Text>
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel color={textColor}>Threshold</FormLabel>
                    <NumberInput
                      value={rules.milestoneRewards?.likesThreshold}
                      onChange={(_, value) =>
                        updateNestedField('milestoneRewards.likesThreshold', value)
                      }
                      min={1}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel color={textColor}>Reward</FormLabel>
                    <NumberInput
                      value={rules.milestoneRewards?.likesReward}
                      onChange={(_, value) =>
                        updateNestedField('milestoneRewards.likesReward', value)
                      }
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel color={textColor}>Window (Days)</FormLabel>
                  <NumberInput
                    value={rules.milestoneRewards?.likesWindowDays}
                    onChange={(_, value) =>
                      updateNestedField('milestoneRewards.likesWindowDays', value)
                    }
                    min={1}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </VStack>

              <Divider />

              <VStack spacing={4} align="stretch">
                <Text fontSize="md" fontWeight="medium" color={textColor}>
                  Comments Milestone
                </Text>
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel color={textColor}>Threshold</FormLabel>
                    <NumberInput
                      value={rules.milestoneRewards?.commentsThreshold}
                      onChange={(_, value) =>
                        updateNestedField('milestoneRewards.commentsThreshold', value)
                      }
                      min={1}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel color={textColor}>Reward</FormLabel>
                    <NumberInput
                      value={rules.milestoneRewards?.commentsReward}
                      onChange={(_, value) =>
                        updateNestedField('milestoneRewards.commentsReward', value)
                      }
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel color={textColor}>Window (Days)</FormLabel>
                  <NumberInput
                    value={rules.milestoneRewards?.commentsWindowDays}
                    onChange={(_, value) =>
                      updateNestedField('milestoneRewards.commentsWindowDays', value)
                    }
                    min={1}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </VStack>

              <Divider />

              <VStack spacing={4} align="stretch">
                <Text fontSize="md" fontWeight="medium" color={textColor}>
                  Shares Milestone
                </Text>
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel color={textColor}>Threshold</FormLabel>
                    <NumberInput
                      value={rules.milestoneRewards?.sharesThreshold}
                      onChange={(_, value) =>
                        updateNestedField('milestoneRewards.sharesThreshold', value)
                      }
                      min={1}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel color={textColor}>Reward</FormLabel>
                    <NumberInput
                      value={rules.milestoneRewards?.sharesReward}
                      onChange={(_, value) =>
                        updateNestedField('milestoneRewards.sharesReward', value)
                      }
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel color={textColor}>Window (Days)</FormLabel>
                  <NumberInput
                    value={rules.milestoneRewards?.sharesWindowDays}
                    onChange={(_, value) =>
                      updateNestedField('milestoneRewards.sharesWindowDays', value)
                    }
                    min={1}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Leaderboard Config */}
        <Card bg={bgColor} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                Leaderboard Configuration
              </Text>

              <FormControl>
                <FormLabel color={textColor}>Default Count Type</FormLabel>
                <Select
                  value={rules.leaderboardCountType}
                  onChange={(e) =>
                    setRules({ ...rules, leaderboardCountType: e.target.value })
                  }
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </Select>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* Top Chatter Thresholds */}
        <Card bg={bgColor} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                Top Chatter Thresholds
              </Text>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel color={textColor}>Monthly Threshold</FormLabel>
                  <NumberInput
                    value={rules.topChatterThreshold?.monthly}
                    onChange={(_, value) =>
                      updateNestedField('topChatterThreshold.monthly', value)
                    }
                    min={0}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel color={textColor}>Total Threshold</FormLabel>
                  <NumberInput
                    value={rules.topChatterThreshold?.total}
                    onChange={(_, value) =>
                      updateNestedField('topChatterThreshold.total', value)
                    }
                    min={0}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Anti-Spam */}
        <Card bg={bgColor} border="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                Anti-Spam Settings
              </Text>

              <FormControl>
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <FormLabel mb={0} color={textColor}>
                      Enable Spam Detection
                    </FormLabel>
                    <Text fontSize="xs" color={textColor} opacity={0.7}>
                      Automatically detect and flag spam
                    </Text>
                  </VStack>
                  <Switch
                    isChecked={rules.spamDetection?.enabled}
                    onChange={(e) =>
                      updateNestedField('spamDetection.enabled', e.target.checked)
                    }
                    colorScheme="blue"
                  />
                </HStack>
              </FormControl>

              {rules.spamDetection?.enabled && (
                <>
                  <FormControl>
                    <FormLabel color={textColor}>Max Daily Actions</FormLabel>
                    <NumberInput
                      value={rules.spamDetection?.maxDailyActions}
                      onChange={(_, value) =>
                        updateNestedField('spamDetection.maxDailyActions', value)
                      }
                      min={1}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel color={textColor}>Duplicate Message Window (Hours)</FormLabel>
                    <NumberInput
                      value={rules.spamDetection?.duplicateMessageWindow}
                      onChange={(_, value) =>
                        updateNestedField('spamDetection.duplicateMessageWindow', value)
                      }
                      min={1}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </>
              )}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default AdminRuleManagement;

