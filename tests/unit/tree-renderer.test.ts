/**
 * Unit tests for TreeRenderer
 */

import { TreeRenderer } from '../../src/utils/tree-renderer';
import {
  Task,
  TaskStatus,
  TreeNode,
  RenderTheme,
  Priority,
} from '../../src/types/progress-tracker.types';
import { DEFAULT_RENDER_OPTIONS } from '../../src/config/progress-tracker-defaults';

describe('TreeRenderer', () => {
  let renderer: TreeRenderer;

  beforeEach(() => {
    renderer = new TreeRenderer(DEFAULT_RENDER_OPTIONS);
  });

  const createTask = (
    id: string,
    content: string,
    status: TaskStatus = TaskStatus.PENDING
  ): Task => ({
    id,
    content,
    activeForm: `Doing ${content}`,
    status,
    priority: Priority.MEDIUM,
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['test'],
    },
    children: [],
  });

  const createTreeNode = (
    task: Task,
    children: TreeNode[] = [],
    depth = 0,
    isLast = true
  ): TreeNode => ({
    task,
    children,
    depth,
    isLast,
    parentChain: [],
  });

  describe('render', () => {
    it('should render empty tree', () => {
      const result = renderer.render([]);
      expect(result).toBe('');
    });

    it('should render single task', () => {
      const task = createTask('1', 'Test task');
      const node = createTreeNode(task);
      const result = renderer.render([node]);

      expect(result).toContain('Test task');
    });

    it('should render task hierarchy', () => {
      const parent = createTask('1', 'Parent');
      const child1 = createTask('2', 'Child 1');
      const child2 = createTask('3', 'Child 2');

      const node = createTreeNode(parent, [
        createTreeNode(child1, [], 1, false),
        createTreeNode(child2, [], 1, true),
      ]);

      const result = renderer.render([node]);
      expect(result).toContain('Parent');
      expect(result).toContain('Child 1');
      expect(result).toContain('Child 2');
    });

    it('should show activeForm for in_progress tasks', () => {
      const task = createTask('1', 'Original content', TaskStatus.IN_PROGRESS);
      task.activeForm = 'Working on it';
      const node = createTreeNode(task);

      const result = renderer.render([node]);
      expect(result).toContain('Working on it');
    });

    it('should show content for non-in_progress tasks', () => {
      const task = createTask('1', 'Original content', TaskStatus.PENDING);
      const node = createTreeNode(task);

      const result = renderer.render([node]);
      expect(result).toContain('Original content');
    });
  });

  describe('rendering options', () => {
    it('should honor collapseCompleted option', () => {
      renderer.updateOptions({ collapseCompleted: true });

      const completed = createTask('1', 'Completed task', TaskStatus.COMPLETED);
      const pending = createTask('2', 'Pending task', TaskStatus.PENDING);

      const result = renderer.render([
        createTreeNode(completed),
        createTreeNode(pending),
      ]);

      expect(result).not.toContain('Completed task');
      expect(result).toContain('Pending task');
    });

    it('should respect maxDepth option', () => {
      renderer.updateOptions({ maxDepth: 1 });

      const root = createTask('1', 'Root');
      const child = createTask('2', 'Child');
      const grandchild = createTask('3', 'Grandchild');

      const node = createTreeNode(root, [
        createTreeNode(child, [createTreeNode(grandchild, [], 2)], 1),
      ]);

      const result = renderer.render([node]);
      expect(result).toContain('Root');
      expect(result).toContain('Child');
      expect(result).not.toContain('Grandchild');
    });

    it('should show progress bars when enabled', () => {
      renderer.updateOptions({ showProgress: true });

      const parent = createTask('1', 'Parent');
      const child1 = createTask('2', 'Child 1', TaskStatus.COMPLETED);
      const child2 = createTask('3', 'Child 2', TaskStatus.PENDING);

      const node = createTreeNode(parent, [
        createTreeNode(child1, [], 1),
        createTreeNode(child2, [], 1),
      ]);

      const result = renderer.render([node]);
      expect(result).toContain('%'); // Progress percentage
    });

    it('should show timestamps when enabled', () => {
      renderer.updateOptions({ showTimestamps: true });

      const task = createTask('1', 'Task with timestamp');
      task.metadata.updatedAt = Date.now();
      const node = createTreeNode(task);

      const result = renderer.render([node]);
      expect(result).toMatch(/\[.*ago\]|\[just now\]/);
    });

    it('should show metadata tags when enabled', () => {
      renderer.updateOptions({ showMetadata: true });

      const task = createTask('1', 'Task with tags');
      task.metadata.tags = ['tag1', 'tag2'];
      const node = createTreeNode(task);

      const result = renderer.render([node]);
      expect(result).toContain('tag1');
      expect(result).toContain('tag2');
    });

    it('should disable colorization when requested', () => {
      renderer.updateOptions({ colorize: false });

      const task = createTask('1', 'No color task', TaskStatus.COMPLETED);
      const node = createTreeNode(task);

      const result = renderer.render([node]);
      expect(result).not.toMatch(/\x1b\[/); // No ANSI codes
    });

    it('should truncate long content when maxWidth is set', () => {
      renderer.updateOptions({ maxWidth: 30 });

      const task = createTask('1', 'This is a very long task content that should be truncated');
      const node = createTreeNode(task);

      const result = renderer.render([node]);
      expect(result.length).toBeLessThan(100);
    });
  });

  describe('themes', () => {
    it('should render with ASCII theme', () => {
      renderer.updateOptions({ theme: RenderTheme.ASCII });

      const parent = createTask('1', 'Parent');
      const child = createTask('2', 'Child');
      const node = createTreeNode(parent, [createTreeNode(child, [], 1)]);

      const result = renderer.render([node]);
      expect(result).toMatch(/[\|\-\+`]/); // ASCII tree characters
    });

    it('should render with UNICODE theme', () => {
      renderer.updateOptions({ theme: RenderTheme.UNICODE });

      const parent = createTask('1', 'Parent');
      const child = createTask('2', 'Child');
      const node = createTreeNode(parent, [createTreeNode(child, [], 1)]);

      const result = renderer.render([node]);
      expect(result).toMatch(/[│─├└]/); // Unicode tree characters
    });

    it('should render with EMOJI theme', () => {
      renderer.updateOptions({ theme: RenderTheme.EMOJI });

      const task = createTask('1', 'Test', TaskStatus.COMPLETED);
      const node = createTreeNode(task);

      const result = renderer.render([node]);
      expect(result).toContain('✅'); // Emoji status icon
    });

    it('should render with MINIMAL theme', () => {
      renderer.updateOptions({ theme: RenderTheme.MINIMAL });

      const task = createTask('1', 'Test', TaskStatus.PENDING);
      const node = createTreeNode(task);

      const result = renderer.render([node]);
      expect(result).toContain('-'); // Minimal status icon
    });
  });

  describe('status icons', () => {
    it('should show correct icon for PENDING status', () => {
      const task = createTask('1', 'Test', TaskStatus.PENDING);
      const node = createTreeNode(task);
      const result = renderer.render([node]);
      expect(result).toContain('○');
    });

    it('should show correct icon for IN_PROGRESS status', () => {
      const task = createTask('1', 'Test', TaskStatus.IN_PROGRESS);
      const node = createTreeNode(task);
      const result = renderer.render([node]);
      expect(result).toContain('◐');
    });

    it('should show correct icon for COMPLETED status', () => {
      const task = createTask('1', 'Test', TaskStatus.COMPLETED);
      const node = createTreeNode(task);
      const result = renderer.render([node]);
      expect(result).toContain('●');
    });

    it('should show correct icon for BLOCKED status', () => {
      const task = createTask('1', 'Test', TaskStatus.BLOCKED);
      const node = createTreeNode(task);
      const result = renderer.render([node]);
      expect(result).toContain('⊗');
    });

    it('should show correct icon for FAILED status', () => {
      const task = createTask('1', 'Test', TaskStatus.FAILED);
      const node = createTreeNode(task);
      const result = renderer.render([node]);
      expect(result).toContain('✗');
    });
  });

  describe('configuration', () => {
    it('should update options', () => {
      const newOptions = {
        showProgress: false,
        showTimestamps: true,
      };

      renderer.updateOptions(newOptions);
      const options = renderer.getOptions();

      expect(options.showProgress).toBe(false);
      expect(options.showTimestamps).toBe(true);
    });

    it('should get current options', () => {
      const options = renderer.getOptions();
      expect(options).toHaveProperty('theme');
      expect(options).toHaveProperty('showStatus');
      expect(options).toHaveProperty('colorize');
    });
  });

  describe('edge cases', () => {
    it('should handle tasks without children array', () => {
      const task = createTask('1', 'Test');
      delete task.children;
      const node = createTreeNode(task);

      const result = renderer.render([node]);
      expect(result).toContain('Test');
    });

    it('should handle tasks with empty children array', () => {
      const task = createTask('1', 'Test');
      task.children = [];
      const node = createTreeNode(task);

      const result = renderer.render([node]);
      expect(result).toContain('Test');
    });

    it('should handle Japanese content', () => {
      const task = createTask('1', '日本語のタスク');
      const node = createTreeNode(task);

      const result = renderer.render([node]);
      expect(result).toContain('日本語のタスク');
    });

    it('should handle mixed language content', () => {
      const task = createTask('1', 'English 日本語 Mixed');
      const node = createTreeNode(task);

      const result = renderer.render([node]);
      expect(result).toContain('English');
      expect(result).toContain('日本語');
    });
  });
});
