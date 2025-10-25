# Window Snapping Feature Guide

## Overview
The window snapping feature allows you to quickly arrange windows by dragging them to screen edges or corners. This creates an efficient multi-window workflow similar to modern operating systems.

## How to Use

### Basic Snapping
1. **Drag a window** by clicking and holding on the window header
2. **Move toward screen edges** - you'll see a blue ghost preview showing where the window will snap
3. **Release the mouse** to snap the window to that position

### Available Snap Zones

#### Half-Screen Zones
- **Left Half**: Drag to the left edge of the screen
- **Right Half**: Drag to the right edge of the screen  
- **Top Half**: Drag to the top edge of the screen
- **Bottom Half**: Drag to the bottom edge of the screen

#### Quarter-Screen Zones
- **Top Left Quarter**: Drag to the top-left corner
- **Top Right Quarter**: Drag to the top-right corner
- **Bottom Left Quarter**: Drag to the bottom-left corner
- **Bottom Right Quarter**: Drag to the bottom-right corner

#### Full-Screen Zone
- **Full Screen**: Drag to any edge and continue past the snap threshold

### Visual Feedback

#### During Drag
- **Blue ghost preview** shows the target snap zone
- **Zone label** indicates which area you're snapping to
- **Corner/edge indicators** highlight the specific snap zone

#### After Snapping
- **Green ring** around snapped windows
- **Snap zone badge** in the window header
- **Smooth animations** when snapping/unsnapping

### Manual Override

#### Unsnapping Windows
- **Double-click** the window header to unsnap
- **Drag away** from snap zones to unsnap
- **Manual resize** still works normally

#### Manual Resizing
- All resize handles work as before
- Windows are constrained to screen boundaries
- Minimum size limits are enforced

### Configuration

The snapping behavior can be configured through the store:

```typescript
// Adjust snap sensitivity (default: 50px)
updateSnapConfig({ snapThreshold: 30 });

// Adjust animation speed (default: 200ms)
updateSnapConfig({ animationDuration: 150 });

// Toggle snapping on/off
updateSnapConfig({ enableSnapping: false });
```

### Tips for Best Experience

1. **Use snap zones for quick layouts** - Perfect for side-by-side document editing
2. **Quarter zones for reference** - Great for keeping reference materials visible
3. **Half zones for focus** - Ideal for concentrating on one main task
4. **Double-click to unsnap** - Quick way to return to free-form positioning
5. **Combine with manual resize** - Fine-tune snapped windows as needed

### Technical Details

- **Snap threshold**: 50px from screen edges (configurable)
- **Animation duration**: 200ms smooth transitions
- **Constraint enforcement**: Windows never extend beyond viewport
- **Minimum sizes**: 300x200px minimum window dimensions
- **Z-index management**: Snapped windows maintain proper layering

## Troubleshooting

**Windows not snapping?**
- Check that snapping is enabled in settings
- Ensure you're dragging within the snap threshold (50px)
- Try dragging more slowly toward edges

**Ghost preview not showing?**
- Make sure you're dragging the window header
- Check that the window is not minimized
- Verify snapping is enabled

**Windows extending off-screen?**
- The system automatically constrains windows to viewport
- Manual resizing also respects screen boundaries
- Minimum size limits prevent windows from becoming too small
