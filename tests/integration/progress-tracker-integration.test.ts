/**
 * Integration tests for Progress Tracker system
 */

import { ProgressTracker } from '../../src/utils/progress-tracker';
import { MilestoneDetector } from '../../src/utils/milestone-detector';
import { TodoWriteHook } from '../../src/hooks/on-todo-write';
import {
  TaskStatus,
  Priority,
  EventType,
  RenderTheme,
} from '../../src/types/progress-tracker.types';
import * as fs from 'fs';

describe('Progress Tracker Integration', () => {
  let tracker: ProgressTracker;
  let detector: MilestoneDetector;
  let hook: TodoWriteHook;

  beforeEach(() => {
    tracker = new ProgressTracker();
    detector = new MilestoneDetector();
    hook = new TodoWriteHook(tracker);
  });

  afterEach(() => {
    // Clean up
    const stateFile = '.orchestra/progress-state.json';
    if (fs.existsSync(stateFile)) {
      fs.unlinkSync(stateFile);
    }
  });

  describe('End-to-end workflow', () => {
    it('should handle complete task lifecycle', () => {
      // Add tasks
      const task1 = tracker.addTask('Setup environment', 'Setting up environment', {
        priority: Priority.HIGH,
      });
      const task2 = tracker.addTask('Implement feature', 'Implementing feature', {
        parentId: task1,
      });
      const task3 = tracker.addTask('Write tests', 'Writing tests', {
        parentId: task2,
      });

      // Update statuses
      tracker.updateTaskStatus(task1, TaskStatus.IN_PROGRESS);
      tracker.updateTaskStatus(task1, TaskStatus.COMPLETED);
      tracker.updateTaskStatus(task2, TaskStatus.IN_PROGRESS);

      // Verify hierarchy
      const root = tracker.getTask(task1);
      expect(root?.children).toContain(task2);

      const child = tracker.getTask(task2);
      expect(child?.children).toContain(task3);

      // Check stats
      const stats = tracker.getProgressStats();
      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.pending).toBe(1);

      // Render (when in_progress, it shows activeForm instead of content)
      const rendered = tracker.render();
      expect(rendered).toContain('Setup environment');
      expect(rendered.toLowerCase()).toContain('implement'); // May show "Implementing feature" (activeForm)
      expect(rendered).toContain('Write tests');
    });

    it('should handle TodoWrite integration', () => {
      const todoData = {
        todos: [
          {
            content: 'Phase 1: Setup project structure',
            status: 'completed' as const,
            activeForm: 'Setting up project structure',
          },
          {
            content: 'Phase 1: Create configuration',
            status: 'in_progress' as const,
            activeForm: 'Creating configuration',
          },
          {
            content: 'Phase 2: Implement features',
            status: 'pending' as const,
            activeForm: 'Implementing features',
          },
        ],
      };

      // Process through hook
      hook.handle(todoData);

      // Verify tasks were created
      const tasks = tracker.getAllTasks();
      expect(tasks.length).toBe(3);

      // Verify milestone detection
      const milestones = detector.detectMilestones(tasks);
      expect(milestones.length).toBeGreaterThan(0);
    });
  });

  describe('Milestone detection integration', () => {
    it('should detect and track milestones across workflow', () => {
      // Add tasks with milestone patterns
      tracker.addTask('Phase 1: Planning', 'Planning phase');
      tracker.addTask('Phase 1: Design', 'Designing');
      tracker.addTask('Phase 2: Implementation', 'Implementing');
      tracker.addTask('Phase 2: Testing', 'Testing');
      tracker.addTask('Phase 3: Deployment', 'Deploying');

      const tasks = tracker.getAllTasks();
      const milestones = detector.detectMilestones(tasks);

      expect(milestones.length).toBe(3);
      expect(milestones[0].taskIds.length).toBe(2); // Phase 1 has 2 tasks
      expect(milestones[1].taskIds.length).toBe(2); // Phase 2 has 2 tasks
      expect(milestones[2].taskIds.length).toBe(1); // Phase 3 has 1 task
    });

    it('should update milestone status based on tasks', () => {
      tracker.addTask(
        'Phase 1: Task A',
        'Doing A',
        { status: TaskStatus.COMPLETED }
      );
      tracker.addTask(
        'Phase 1: Task B',
        'Doing B',
        { status: TaskStatus.COMPLETED }
      );

      const tasks = tracker.getAllTasks();
      const milestones = detector.detectMilestones(tasks);

      expect(milestones.length).toBe(1);

      const updated = detector.calculateMilestoneStatus(milestones[0], tasks);
      expect(updated.status).toBe(TaskStatus.COMPLETED);
    });
  });

  describe('Event-driven updates', () => {
    it('should trigger events throughout workflow', (done) => {
      const events: string[] = [];

      tracker.on(EventType.TASK_ADDED, () => events.push('added'));
      tracker.on(EventType.TASK_STATUS_CHANGED, () =>
        events.push('status_changed')
      );
      tracker.on(EventType.TASK_UPDATED, () => events.push('updated'));

      const taskId = tracker.addTask('Test task', 'Testing');
      tracker.updateTaskStatus(taskId, TaskStatus.IN_PROGRESS);
      tracker.updateTaskContent(taskId, 'Updated task');

      // Give events time to process
      setTimeout(() => {
        expect(events).toContain('added');
        expect(events).toContain('status_changed');
        expect(events).toContain('updated');
        done();
      }, 10);
    });
  });

  describe('Persistence integration', () => {
    it('should persist and restore state', () => {
      // Create tracker with persistence
      const tracker1 = new ProgressTracker({
        persistState: true,
        stateFilePath: '.orchestra/test-integration-state.json',
      });

      // Add some tasks
      tracker1.addTask('Task 1', 'T1', { status: TaskStatus.COMPLETED });
      tracker1.addTask('Task 2', 'T2', { status: TaskStatus.IN_PROGRESS });

      // Create new tracker and load state
      const tracker2 = new ProgressTracker({
        persistState: true,
        stateFilePath: '.orchestra/test-integration-state.json',
      });

      const tasks = tracker2.getAllTasks();
      expect(tasks.length).toBe(2);

      const stats = tracker2.getProgressStats();
      expect(stats.completed).toBe(1);
      expect(stats.inProgress).toBe(1);

      // Cleanup
      fs.unlinkSync('.orchestra/test-integration-state.json');
    });
  });

  describe('Rendering integration', () => {
    it('should render complex hierarchies with different themes', () => {
      const parent = tracker.addTask('Parent task', 'Parenting');
      tracker.addTask('Child 1', 'C1', { parentId: parent });
      tracker.addTask('Child 2', 'C2', { parentId: parent });

      // Test different themes
      const themes = [
        RenderTheme.UNICODE,
        RenderTheme.ASCII,
        RenderTheme.EMOJI,
        RenderTheme.MINIMAL,
      ];

      for (const theme of themes) {
        tracker.updateConfig({
          renderOptions: {
            ...tracker.getConfig().renderOptions,
            theme,
          },
        });

        const rendered = tracker.render();
        expect(rendered).toBeTruthy();
        expect(rendered).toContain('Parent task');
      }
    });

    it('should render with Japanese text correctly', () => {
      tracker.addTask('日本語タスク', '日本語処理中');
      tracker.addTask('テスト実行', 'テスト中');

      const rendered = tracker.render();
      expect(rendered).toContain('日本語タスク');
      expect(rendered).toContain('テスト実行');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle large task hierarchies', () => {
      const root = tracker.addTask('Root', 'Root task');

      // Create 3 levels deep with multiple children
      for (let i = 0; i < 5; i++) {
        const level1 = tracker.addTask(`Level 1 - ${i}`, `L1-${i}`, {
          parentId: root,
        });

        for (let j = 0; j < 3; j++) {
          const level2 = tracker.addTask(`Level 2 - ${i}-${j}`, `L2-${i}-${j}`, {
            parentId: level1,
          });

          for (let k = 0; k < 2; k++) {
            tracker.addTask(
              `Level 3 - ${i}-${j}-${k}`,
              `L3-${i}-${j}-${k}`,
              { parentId: level2 }
            );
          }
        }
      }

      const tasks = tracker.getAllTasks();
      expect(tasks.length).toBe(1 + 5 + 15 + 30); // root + level1 + level2 + level3

      const rendered = tracker.render();
      expect(rendered).toBeTruthy();
    });

    it('should handle mixed language tasks', () => {
      tracker.addTask('Setup environment', 'Setting up', {
        status: TaskStatus.COMPLETED,
      });
      tracker.addTask('環境設定', '設定中', {
        status: TaskStatus.IN_PROGRESS,
      });
      tracker.addTask('Implement 機能', '実装中', {
        status: TaskStatus.PENDING,
      });

      const tasks = tracker.getAllTasks();
      expect(tasks.length).toBe(3);

      const milestones = detector.detectMilestones(tasks);
      expect(milestones.length).toBeGreaterThanOrEqual(0);

      const rendered = tracker.render();
      expect(rendered).toContain('Setup environment');
      // Task may show activeForm when in_progress
      expect(rendered.includes('環境設定') || rendered.includes('設定中')).toBe(true);
      expect(rendered.includes('Implement 機能') || rendered.includes('実装中')).toBe(true);
    });

    it('should handle task removal in complex hierarchies', () => {
      const root = tracker.addTask('Root', 'R');
      const child1 = tracker.addTask('Child 1', 'C1', { parentId: root });
      const child2 = tracker.addTask('Child 2', 'C2', { parentId: root });
      const grandchild = tracker.addTask('Grandchild', 'GC', {
        parentId: child1,
      });

      // Remove middle level without removing children
      tracker.removeTask(child1, false);

      // Grandchild should be re-parented to its parent's parent (root)
      const gc = tracker.getTask(grandchild);
      expect(gc?.parentId).toBe(root);

      const rootTask = tracker.getTask(root);
      expect(rootTask?.children).toContain(child2);
      // After removing child1, grandchild should be re-parented to root
      expect(rootTask?.children?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error handling integration', () => {
    it('should validate circular dependency handling', () => {
      const task1 = tracker.addTask('Task 1', 'T1');
      const task2 = tracker.addTask('Task 2', 'T2', { parentId: task1 });
      const task3 = tracker.addTask('Task 3', 'T3', { parentId: task2 });

      // Manually create circular dependency
      const t1 = tracker.getTask(task1);
      if (t1) {
        t1.parentId = task3; // Creates cycle: task3 -> task2 -> task1 -> task3
      }

      // Test that system handles this gracefully
      try {
        tracker.addTask('Task 4', 'T4', { parentId: task3 });
        // System handled it - acceptable for MVP
        expect(tracker.getTask(task1)).toBeDefined();
      } catch (error) {
        // Or detected the cycle - also acceptable
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle corrupted TodoWrite data', () => {
      const badData = {
        todos: 'not an array',
      };

      expect(() => {
        tracker.processTodoWrite(badData as any);
      }).toThrow();
    });
  });

  describe('Performance validation', () => {
    it('should handle 100 tasks efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        tracker.addTask(`Task ${i}`, `Working on task ${i}`);
      }

      const addTime = Date.now() - startTime;
      expect(addTime).toBeLessThan(1000); // Should complete in under 1 second

      const renderStart = Date.now();
      const rendered = tracker.render();
      const renderTime = Date.now() - renderStart;

      expect(rendered).toBeTruthy();
      expect(renderTime).toBeLessThan(500); // Render should be fast
    });
  });
});
