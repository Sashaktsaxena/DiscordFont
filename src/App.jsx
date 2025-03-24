

import React, { useState, useRef } from 'react';
import { 
  MantineProvider, 
  Container, 
  Title, 
  Textarea, 
  Button, 
  Group, 
  Tooltip,
  Paper,
  Stack
} from '@mantine/core';
import { 
  IconBold, 
  IconItalic, 
  IconUnderline, 
  IconPalette 
} from '@tabler/icons-react';

const DiscordTextStyler = () => {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const [copyCount, setCopyCount] = useState(0);

  // ANSI color and style mappings
  const styleOptions = [
    // Text styles
    { 
      icon: IconBold, 
      ansiCode: '1', 
      type: 'style',
      tooltip: 'Bold'
    },
    { 
      icon: IconItalic, 
      ansiCode: '3', 
      type: 'style',
      tooltip: 'Italic'
    },
    { 
      icon: IconUnderline, 
      ansiCode: '4', 
      type: 'style',
      tooltip: 'Underline'
    },
    
    // Foreground Colors
    { name: 'Dark Gray', ansiCode: '30', type: 'fg' },
    { name: 'Red', ansiCode: '31', type: 'fg' },
    { name: 'Green', ansiCode: '32', type: 'fg' },
    { name: 'Gold', ansiCode: '33', type: 'fg' },
    { name: 'Blue', ansiCode: '34', type: 'fg' },
    { name: 'Pink', ansiCode: '35', type: 'fg' },
    { name: 'Teal', ansiCode: '36', type: 'fg' },
    { name: 'White', ansiCode: '37', type: 'fg' },
    
    // Background Colors
    { name: 'Black', ansiCode: '40', type: 'bg' },
    { name: 'Rust Brown', ansiCode: '41', type: 'bg' },
    { name: 'Gray (40%)', ansiCode: '42', type: 'bg' },
    { name: 'Blurple', ansiCode: '45', type: 'bg' },
    { name: 'Cream White', ansiCode: '47', type: 'bg' }
  ];

  // Handle text styling
  const applyStyle = (ansiCode, type) => {
    const textarea = textareaRef.current;
    const selection = window.getSelection();
    const selectedText = selection.toString();

    if (!selectedText) {
      alert('Please select some text first');
      return;
    }

    // Create a span with the appropriate ANSI class
    const span = document.createElement('span');
    span.innerText = selectedText;
    span.classList.add(`ansi-${ansiCode}`);

    // Replace selected text with styled span
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(span);

    // Reselect the styled text
    range.selectNodeContents(span);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  // Copy to clipboard in Discord ANSI format
  const copyToClipboard = () => {
    const toCopy = "```ansi\n" + convertToANSI(textareaRef.current.childNodes) + "\n```";
    
    navigator.clipboard.writeText(toCopy).then(() => {
      const funnyCopyMessages = [
        "Copied!", "Double Copy!", "Triple Copy!", "Dominating!!", 
        "Rampage!!", "Mega Copy!!", "Unstoppable!!", "Wicked Sick!!", 
        "Monster Copy!!!", "GODLIKE!!!", "BEYOND GODLIKE!!!!"
      ];

      const newCopyCount = Math.min(11, copyCount + 1);
      setCopyCount(newCopyCount);
    });
  };

  // Convert nodes to ANSI formatted text
  const convertToANSI = (nodes, states = [{ fg: 2, bg: 2, st: 2 }]) => {
    let text = "";
    for (const node of nodes) {
      if (node.nodeType === 3) {
        text += node.textContent;
        continue;
      }
      if (node.nodeName === "BR") {
        text += "\n";
        continue;   
      }
      const ansiCode = +(node.className.split("-")[1]);
      const newState = {...states[states.length - 1]};

      if (ansiCode < 30) newState.st = ansiCode;
      if (ansiCode >= 30 && ansiCode < 40) newState.fg = ansiCode;
      if (ansiCode >= 40) newState.bg = ansiCode;

      states.push(newState);
      text += `\x1b[${newState.st};${(ansiCode >= 40) ? newState.bg : newState.fg}m`;
      text += convertToANSI(node.childNodes, states);
      states.pop();
      text += `\x1b[0m`;
      
      if (states[states.length - 1].fg !== 2) 
        text += `\x1b[${states[states.length - 1].st};${states[states.length - 1].fg}m`;
      if (states[states.length - 1].bg !== 2) 
        text += `\x1b[${states[states.length - 1].st};${states[states.length - 1].bg}m`;
    }
    return text;
  };

  return (
    <MantineProvider>
      <Container size="md" p="md">
        <Paper shadow="md" p="lg" radius="md">
          <Stack>
            <Title order={2} ta="center" mb="md">
              Discord Text Styler
            </Title>

            {/* Styling Buttons */}
            <Group justify="center" mb="md">
              {styleOptions.map((option, index) => (
                <Tooltip 
                  key={index} 
                  label={option.tooltip || option.name}
                  position="bottom"
                >
                  <Button 
                    onClick={() => applyStyle(option.ansiCode, option.type)}
                    variant="light"
                    color="blue"
                    leftSection={option.icon ? <option.icon size={16} /> : null}
                  >
                    {option.name || ''}
                  </Button>
                </Tooltip>
              ))}
            </Group>

            {/* Textarea */}
            <div 
              ref={textareaRef}
              contentEditable 
              style={{
                minHeight: '300px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                padding: '10px',
                backgroundColor: '#f8f9fa'
              }}
              onInput={(e) => {
                // Basic HTML tag escaping
                const base = e.target.innerHTML.replace(
                  /<(\/?(br|span|span class="ansi-[0-9]*"))>/g,
                  "[$1]"
                );
                if (base.includes("<") || base.includes(">")) {
                  e.target.innerHTML = base
                    .replace(/<.*?>/g,"")
                    .replace(/[<>]/g,"")
                    .replace(/\[(\/?(br|span|span class="ansi-[0-9]*"))\]/g,"<$1>");
                }
              }}
            />

            {/* Copy Button */}
            <Button 
              onClick={copyToClipboard}
              fullWidth
              color={copyCount <= 8 ? 'green' : 'red'}
              size="lg"
            >
              {[
                "Copy text as Discord formatted", 
                "Copied!", 
                "Double Copy!", 
                "Triple Copy!", 
                "Dominating!!", 
                "Rampage!!", 
                "Mega Copy!!", 
                "Unstoppable!!", 
                "Wicked Sick!!", 
                "Monster Copy!!!", 
                "GODLIKE!!!", 
                "BEYOND GODLIKE!!!!"
              ][copyCount]}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </MantineProvider>
  );
};

export default DiscordTextStyler;