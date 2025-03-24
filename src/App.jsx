import React, { useState, useRef, useCallback } from 'react';
import { 
  MantineProvider, 
  Container, 
  Title, 
  Button, 
  Group, 
  Tooltip,
  Paper,
  Stack,
  Select
} from '@mantine/core';
import { 
  IconBold, 
  IconItalic, 
  IconUnderline 
} from '@tabler/icons-react';

const DiscordTextStyler = () => {
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    foregroundColor: null,
    backgroundColor: null
  });
  const textareaRef = useRef(null);
  const [copyCount, setCopyCount] = useState(0);
  const savedSelectionRef = useRef(null);

  // Text style options
  const textStyleOptions = [
    { 
      key: 'bold',
      icon: IconBold, 
      ansiCode: '1', 
      tooltip: 'Bold'
    },
    { 
      key: 'italic',
      icon: IconItalic, 
      ansiCode: '3', 
      tooltip: 'Italic'
    },
    { 
      key: 'underline',
      icon: IconUnderline, 
      ansiCode: '4', 
      tooltip: 'Underline'
    }
  ];

  // Foreground Color Options
  const foregroundColors = [
    { value: '30', label: 'Dark Gray', color: '#808080' },
    { value: '31', label: 'Red', color: '#FF0000' },
    { value: '32', label: 'Green', color: '#00FF00' },
    { value: '33', label: 'Gold', color: '#FFD700' },
    { value: '34', label: 'Blue', color: '#0000FF' },
    { value: '35', label: 'Pink', color: '#FFC0CB' },
    { value: '36', label: 'Teal', color: '#008080' },
    { value: '37', label: 'White', color: '#FFFFFF' }
  ];

  // Background Color Options
  const backgroundColors = [
    { value: '40', label: 'Black', color: '#000000' },
    { value: '41', label: 'Rust Brown', color: '#8B4513' },
    { value: '42', label: 'Gray (40%)', color: '#666666' },
    { value: '45', label: 'Blurple', color: '#5865F2' },
    { value: '47', label: 'Cream White', color: '#FFFAF0' }
  ];

  // Save current selection
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  }, []);

  // Restore previous selection
  const restoreSelection = useCallback(() => {
    if (savedSelectionRef.current) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedSelectionRef.current);
    }
  }, []);

  // Apply styling to selected text
  const applyStyle = (type, value) => {
    // Restore previous selection
    restoreSelection();

    const selection = window.getSelection();
    const selectedText = selection.toString();

    if (!selectedText) {
      alert('Please select some text first');
      return;
    }

    // Create a span with the appropriate styling
    const span = document.createElement('span');
    span.innerText = selectedText;
    
    // Prepare style classes
    const styleCombination = [];
    
    // Add text styles
    if (type === 'bold') {
      span.style.fontWeight = activeStyles.bold ? 'normal' : 'bold';
      styleCombination.push('ansi-1');
    }
    if (type === 'italic') {
      span.style.fontStyle = activeStyles.italic ? 'normal' : 'italic';
      styleCombination.push('ansi-3');
    }
    if (type === 'underline') {
      span.style.textDecoration = activeStyles.underline ? 'none' : 'underline';
      styleCombination.push('ansi-4');
    }
    
    // Add color styles
    if (type === 'foregroundColor') {
      const color = foregroundColors.find(c => c.value === value);
      span.style.color = color ? color.color : '';
      styleCombination.push(`ansi-${value}`);
    }
    if (type === 'backgroundColor') {
      const color = backgroundColors.find(c => c.value === value);
      span.style.backgroundColor = color ? color.color : '';
      styleCombination.push(`ansi-${value}`);
    }

    // Add classes
    span.classList.add(...styleCombination);

    // Replace selected text with styled span
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(span);

    // Reselect the styled text
    range.selectNodeContents(span);
    selection.removeAllRanges();
    selection.addRange(range);

    // Save the new selection
    saveSelection();

    // Update active styles
    if (type === 'bold') {
      setActiveStyles(prev => ({ ...prev, bold: !prev.bold }));
    }
    if (type === 'italic') {
      setActiveStyles(prev => ({ ...prev, italic: !prev.italic }));
    }
    if (type === 'underline') {
      setActiveStyles(prev => ({ ...prev, underline: !prev.underline }));
    }
    if (type === 'foregroundColor') {
      setActiveStyles(prev => ({ ...prev, foregroundColor: value }));
    }
    if (type === 'backgroundColor') {
      setActiveStyles(prev => ({ ...prev, backgroundColor: value }));
    }
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
      
      // Collect all ANSI classes
      const classes = node.classList ? Array.from(node.classList) : [];
      const ansiClasses = classes.filter(cls => cls.startsWith('ansi-'));
      
      const newState = {...states[states.length - 1]};
  
      ansiClasses.forEach(cls => {
        const ansiCode = parseInt(cls.split('-')[1], 10);
        
        // Determine the type of ANSI code
        if (ansiCode < 10) {
          // Style codes (bold, italic, underline)
          newState.st = ansiCode;
        } else if (ansiCode >= 30 && ansiCode < 40) {
          // Foreground color codes
          newState.fg = ansiCode;
        } else if (ansiCode >= 40 && ansiCode < 50) {
          // Background color codes
          newState.bg = ansiCode;
        }
      });
  
      states.push(newState);
      
      // Apply ANSI formatting only if there are actual codes to apply
      if (newState.st !== 2 || newState.fg !== 2 || newState.bg !== 2) {
        let ansiFormatting = "\x1b[";
        const formattingCodes = [];
        
        if (newState.st !== 2) formattingCodes.push(newState.st);
        if (newState.fg !== 2) formattingCodes.push(newState.fg);
        if (newState.bg !== 2) formattingCodes.push(newState.bg);
        
        text += ansiFormatting + formattingCodes.join(';') + "m";
      }
  
      // Recursively process child nodes
      text += convertToANSI(node.childNodes, states);
      
      // Reset formatting
      states.pop();
      text += "\x1b[0m";
      
      // Reapply previous state's formatting if exists
      const prevState = states[states.length - 1];
      if (prevState.fg !== 2 || prevState.bg !== 2 || prevState.st !== 2) {
        let restoreFormatting = "\x1b[";
        const restoreCodes = [];
        
        if (prevState.st !== 2) restoreCodes.push(prevState.st);
        if (prevState.fg !== 2) restoreCodes.push(prevState.fg);
        if (prevState.bg !== 2) restoreCodes.push(prevState.bg);
        
        text += restoreFormatting + restoreCodes.join(';') + "m";
      }
    }
    return text;
  };

  const copyToClipboard = () => {
    if (!textareaRef.current) {
      alert('Text area not found');
      return;
    }
  
    try {
      const content = textareaRef.current;
      
      // Check if content exists and has child nodes
      if (!content || !content.childNodes || content.childNodes.length === 0) {
        alert('No content to copy');
        return;
      }
  
      // Convert to ANSI
      const ansiText = "```ansi\n" + convertToANSI(content.childNodes) + "\n```";
      
      // Fallback clipboard methods
      if (navigator.clipboard) {
        // Preferred method
        navigator.clipboard.writeText(ansiText)
          .then(() => {
            const newCopyCount = Math.min(11, copyCount + 1);
            setCopyCount(newCopyCount);
          })
          .catch(err => {
            console.error('Clipboard API failed:', err);
            fallbackCopyTextToClipboard(ansiText);
          });
      } else {
        // Fallback for browsers without Clipboard API
        fallbackCopyTextToClipboard(ansiText);
      }
    } catch (error) {
      console.error('Error in copyToClipboard:', error);
      alert(`Copying failed: ${error.message}`);
    }
  };



  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
  
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
  
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        const newCopyCount = Math.min(11, copyCount + 1);
        setCopyCount(newCopyCount);
        alert('Text copied successfully!');
      } else {
        alert('Unable to copy text');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      alert('Copying is not supported in this browser');
    }
  
    document.body.removeChild(textArea);
  };
  
  return (
    <MantineProvider>
      <Container size="md" p="md">
        <Paper shadow="md" p="lg" radius="md">
          <Stack>
            <Title order={2} ta="center" mb="md">
              Discord Text Styler
            </Title>

            {/* Text Style Buttons */}
            <Group justify="center" mb="md">
              {textStyleOptions.map((option) => (
                <Tooltip 
                  key={option.key} 
                  label={option.tooltip}
                  position="bottom"
                >
                  <Button 
                    onClick={() => {
                      saveSelection();
                      applyStyle(option.key, option.ansiCode);
                    }}
                    variant={activeStyles[option.key] ? 'filled' : 'light'}
                    color="blue"
                    leftSection={<option.icon size={16} />}
                  />
                </Tooltip>
              ))}
            </Group>

            {/* Color Selectors */}
            <Group justify="center" mb="md">
            <Select
  label="Text Color"
  placeholder="Pick text color"
  data={foregroundColors.map(color => ({
    value: color.value,
    label: color.label,
    color: color.color
  }))}
  value={activeStyles.foregroundColor}
  onChange={(value) => {
    // Preserve the current selection
    const savedRange = savedSelectionRef.current;
    
    // Use setTimeout to ensure dropdown closes first and selection is preserved
    setTimeout(() => {
      // Restore the saved selection
      if (savedRange) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedRange);
      }
      
      // Apply the style
      applyStyle('foregroundColor', value);
    }, 0);
  }}
  clearable
  renderOption={({ option, checked }) => (
    <Group flex="1" gap="xs">
      <div 
        style={{
          width: 20,
          height: 20,
          backgroundColor: option.color,
          border: '1px solid black'
        }}
      />
      {option.label}
    </Group>
  )}
/>
<Select
  label="Background Color"
  placeholder="Pick background color"
  data={backgroundColors.map(color => ({
    value: color.value,
    label: color.label,
    color: color.color
  }))}
  value={activeStyles.backgroundColor}
  onChange={(value) => {
    // Preserve the current selection
    const savedRange = savedSelectionRef.current;
    
    // Use setTimeout to ensure dropdown closes first and selection is preserved
    setTimeout(() => {
      // Restore the saved selection
      if (savedRange) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedRange);
      }
      
      // Apply the style
      applyStyle('backgroundColor', value);
    }, 0);
  }}
  clearable
  renderOption={({ option, checked }) => (
    <Group flex="1" gap="xs">
      <div 
        style={{
          width: 20,
          height: 20,
          backgroundColor: option.color,
          border: '1px solid black'
        }}
      />
      {option.label}
    </Group>
  )}
/>
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
              onMouseUp={saveSelection}
              placeholder="Type or select text to style"
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