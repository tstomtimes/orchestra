/**
 * Performance tests for Progress Tracker
 *
 * Tests system performance with large datasets (1000+ tasks)
 */

import { ProgressTracker } from '../../src/utils/progress-tracker';
import { MilestoneDetector } from '../../src/utils/milestone-detector';
import { TaskStatus, Priority } from '../../src/types/progress-tracker.types';

describe('Progress Tracker Performance', () => {
  let tracker: ProgressTracker;
  let detector: MilestoneDetector;

  beforeEach(() => {
    tracker = new ProgressTracker({
      performanceMode: true,
      maxTasks: 20000,
    });
    detector = new MilestoneDetector();
  });

  describe('Task operations at scale', () => {
    it('should handle 1000 tasks efficiently', () => {
      const startTime = Date.now();

      // Add 1000 tasks
      for (let i = 0; i < 1000; i++) {
        tracker.addTask(
          `Task ${i}`,
          `Working on task ${i}`,
          {
            status: i % 3 === 0 ? TaskStatus.COMPLETED : TaskStatus.PENDING,
            priority: i % 100 === 0 ? Priority.HIGH : Priority.MEDIUM,
          }
        );
      }

      const addTime = Date.now() - startTime;
      expect(addTime).toBeLessThan(5000); // Should complete in under 5 seconds

      // Test statistics calculation
      const statsStart = Date.now();
      const stats = tracker.getProgressStats();
      const statsTime = Date.now() - statsStart;

      expect(stats.total).toBe(1000);
      expect(statsTime).toBeLessThan(100); // Should be very fast

      // Test rendering
      const renderStart = Date.now();
      const rendered = tracker.render();
      const renderTime = Date.now() - renderStart;

      expect(rendered).toBeTruthy();
      expect(renderTime).toBeLessThan(2000); // Should render in under 2 seconds
    });

    it('should handle 5000 tasks', () => {
      const startTime = Date.now();

      for (let i = 0; i < 5000; i++) {
        tracker.addTask(`Task ${i}`, `Working on task ${i}`);
      }

      const addTime = Date.now() - startTime;
      expect(addTime).toBeLessThan(15000); // Should complete in under 15 seconds

      expect(tracker.getAllTasks().length).toBe(5000);
    });

    it('should handle hierarchical tasks at scale', () => {
      const startTime = Date.now();

      // Create 100 root tasks, each with 10 children
      for (let i = 0; i < 100; i++) {
        const rootId = tracker.addTask(`Root ${i}`, `Working on root ${i}`);

        for (let j = 0; j < 10; j++) {
          tracker.addTask(
            `Child ${i}-${j}`,
            `Working on child ${i}-${j}`,
            { parentId: rootId }
          );
        }
      }

      const time = Date.now() - startTime;
      expect(time).toBeLessThan(5000); // Should complete in under 5 seconds

      expect(tracker.getAllTasks().length).toBe(1100); // 100 roots + 1000 children
    });

    it('should handle rapid status updates', () => {
      // Create 500 tasks
      const taskIds: string[] = [];
      for (let i = 0; i < 500; i++) {
        const id = tracker.addTask(`Task ${i}`, `Working on task ${i}`);
        taskIds.push(id);
      }

      const startTime = Date.now();

      // Update all tasks status
      for (const id of taskIds) {
        tracker.updateTaskStatus(id, TaskStatus.IN_PROGRESS);
        tracker.updateTaskStatus(id, TaskStatus.COMPLETED);
      }

      const updateTime = Date.now() - startTime;
      expect(updateTime).toBeLessThan(3000); // Should complete in under 3 seconds
    });
  });

  describe('Milestone detection at scale', () => {
    it('should detect milestones in large task sets', () => {
      // Create tasks with milestone patterns
      for (let i = 0; i < 200; i++) {
        const phase = Math.floor(i / 50) + 1;
        tracker.addTask(
          `Phase ${phase}: Task ${i}`,
          `Working on phase ${phase} task ${i}`
        );
      }

      const startTime = Date.now();
      const tasks = tracker.getAllTasks();
      const milestones = detector.detectMilestones(tasks);
      const detectTime = Date.now() - startTime;

      expect(detectTime).toBeLessThan(500); // Should be very fast
      expect(milestones.length).toBeGreaterThan(0);
    });

    it('should group tasks efficiently', () => {
      // Create 1000 tasks
      for (let i = 0; i < 1000; i++) {
        tracker.addTask(`Task ${i}`, `Working on task ${i}`);
      }

      const startTime = Date.now();
      const tasks = tracker.getAllTasks();
      detector.groupTasksByMilestone(tasks);
      const groupTime = Date.now() - startTime;

      expect(groupTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe('Memory efficiency', () => {
    it('should not leak memory with repeated operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const id = tracker.addTask(`Temp task ${i}`, `Working ${i}`);
        tracker.updateTaskStatus(id, TaskStatus.COMPLETED);
        tracker.removeTask(id);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should handle cache efficiently', () => {
      // Create and remove many tasks to test cache management
      for (let i = 0; i < 500; i++) {
        const id = tracker.addTask(`Task ${i}`, `Working ${i}`);
        if (i % 2 === 0) {
          tracker.removeTask(id);
        }
      }

      const stats = tracker.getProgressStats();
      expect(stats.total).toBe(250); // Half were removed
    });
  });

  describe('Rendering performance', () => {
    it('should render deep hierarchies efficiently', () => {
      // Create a deep hierarchy (10 levels)
      let currentId = tracker.addTask('Level 0', 'Working on level 0');

      for (let i = 1; i < 10; i++) {
        currentId = tracker.addTask(
          `Level ${i}`,
          `Working on level ${i}`,
          { parentId: currentId }
        );
      }

      const startTime = Date.now();
      const rendered = tracker.render();
      const renderTime = Date.now() - startTime;

      expect(rendered).toBeTruthy();
      expect(renderTime).toBeLessThan(100); // Should be very fast for deep but narrow tree
    });

    it('should render wide trees efficiently', () => {
      // Create a wide tree (1 root with 500 children)
      const rootId = tracker.addTask('Root', 'Root task');

      for (let i = 0; i < 500; i++) {
        tracker.addTask(`Child ${i}`, `Working on child ${i}`, {
          parentId: rootId,
        });
      }

      const startTime = Date.now();
      const rendered = tracker.render();
      const renderTime = Date.now() - startTime;

      expect(rendered).toBeTruthy();
      expect(renderTime).toBeLessThan(2000); // Should complete in under 2 seconds
    });
  });

  describe('Concurrent operations', () => {
    it('should handle multiple operations in sequence', () => {
      const startTime = Date.now();

      // Mixed operations
      const operations = [];
      for (let i = 0; i < 100; i++) {
        const id = tracker.addTask(`Task ${i}`, `Working ${i}`);
        operations.push(id);
      }

      for (const id of operations) {
        tracker.updateTaskStatus(id, TaskStatus.IN_PROGRESS);
      }

      for (let i = 0; i < 50; i++) {
        tracker.removeTask(operations[i]);
      }

      const stats = tracker.getProgressStats();
      const rendered = tracker.render();

      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(2000);
      expect(stats.total).toBe(50); // Half were removed
      expect(rendered).toBeTruthy();
    });
  });

  describe('TodoWrite processing performance', () => {
    it('should process large TodoWrite data efficiently', () => {
      const todos: Array<{
        content: string;
        status: 'pending' | 'in_progress' | 'completed';
        activeForm: string;
      }> = [];
      for (let i = 0; i < 500; i++) {
        todos.push({
          content: `Todo item ${i}`,
          status: i % 3 === 0 ? 'completed' : 'pending',
          activeForm: `Working on todo ${i}`,
        });
      }

      const startTime = Date.now();
      tracker.processTodoWrite({ todos });
      const processTime = Date.now() - startTime;

      expect(processTime).toBeLessThan(1000); // Should complete in under 1 second
      expect(tracker.getAllTasks().length).toBe(500);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical development workflow', () => {
      const startTime = Date.now();

      // Phase 1: Setup (20 tasks)
      for (let i = 0; i < 20; i++) {
        tracker.addTask(`Phase 1: Setup task ${i}`, `Setting up ${i}`);
      }

      // Phase 2: Implementation (100 tasks)
      for (let i = 0; i < 100; i++) {
        tracker.addTask(`Phase 2: Implement feature ${i}`, `Implementing ${i}`);
      }

      // Phase 3: Testing (50 tasks)
      for (let i = 0; i < 50; i++) {
        tracker.addTask(`Phase 3: Test feature ${i}`, `Testing ${i}`);
      }

      // Simulate progress
      const allTasks = tracker.getAllTasks();
      for (let i = 0; i < 50; i++) {
        tracker.updateTaskStatus(allTasks[i].id, TaskStatus.COMPLETED);
      }

      // Detect milestones
      const milestones = detector.detectMilestones(allTasks);

      // Render progress
      const rendered = tracker.render();

      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(3000); // Entire workflow under 3 seconds
      expect(allTasks.length).toBe(170);
      expect(milestones.length).toBeGreaterThan(0);
      expect(rendered).toBeTruthy();
    });
  });
});
