import { Box, FormControl, FormLabel, HStack, Input, Popover, PopoverTrigger, PopoverContent, PopoverBody } from '@chakra-ui/react';
import { RgbaColorPicker } from 'react-colorful';

/** Parse hex or rgba string to { r, g, b, a } */
function parseColor(value) {
  if (!value || typeof value !== 'string') return { r: 0, g: 132, b: 255, a: 1 };
  const v = value.trim();
  const hex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.exec(v);
  if (hex) {
    const h = hex[1];
    const r = h.length === 3 ? parseInt(h[0] + h[0], 16) : parseInt(h.slice(0, 2), 16);
    const g = h.length === 3 ? parseInt(h[1] + h[1], 16) : parseInt(h.slice(2, 4), 16);
    const b = h.length === 3 ? parseInt(h[2] + h[2], 16) : parseInt(h.slice(4, 6), 16);
    return { r, g, b, a: 1 };
  }
  const rgba = /^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(v);
  if (rgba) {
    return {
      r: parseInt(rgba[1], 10),
      g: parseInt(rgba[2], 10),
      b: parseInt(rgba[3], 10),
      a: rgba[4] != null ? parseFloat(rgba[4]) : 1,
    };
  }
  return { r: 0, g: 132, b: 255, a: 1 };
}

/** Format { r, g, b, a } to rgba string */
function toRgbaString({ r, g, b, a }) {
  return `rgba(${r},${g},${b},${a})`;
}

export default function ColorPickerField({ label, value, onChange, placeholder }) {
  const color = parseColor(value);

  const handlePickerChange = (c) => {
    onChange(toRgbaString(c));
  };

  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <HStack spacing={2} align="center">
        <Popover placement="bottom-start" isLazy>
          <PopoverTrigger>
            <Box
              as="button"
              type="button"
              w="10"
              h="10"
              borderRadius="md"
              border="2px solid"
              borderColor="gray.300"
              _dark={{ borderColor: 'gray.600' }}
              bg={value || 'gray.200'}
              _hover={{ borderColor: 'blue.400' }}
              style={{ background: value || undefined }}
            />
          </PopoverTrigger>
          <PopoverContent w="auto" _focus={{ outline: 'none' }}>
            <PopoverBody p={2}>
              <RgbaColorPicker color={color} onChange={handlePickerChange} />
              <Box mt={2} fontSize="xs" color="gray.600" _dark={{ color: 'gray.400' }}>
                {toRgbaString(color)}
              </Box>
            </PopoverBody>
          </PopoverContent>
        </Popover>
        <Input
          flex={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </HStack>
    </FormControl>
  );
}
