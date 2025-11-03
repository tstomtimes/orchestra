/**
 * Unit tests for MilestoneDetector
 */

import { MilestoneDetector } from '../../src/utils/milestone-detector';
import {
  Task,
  TaskStatus,
  MilestoneType,
  Priority,
} from '../../src/types/progress-tracker.types';

describe('MilestoneDetector', () => {
  let detector: MilestoneDetector;

  beforeEach(() => {
    detector = new MilestoneDetector();
  });

  const createTask = (
    content: string,
    status: TaskStatus = TaskStatus.PENDING
  ): Task => ({
    id: `task_${Date.now()}_${Math.random()}`,
    content,
    activeForm: `Doing ${content}`,
    status,
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  });

  describe('detectMilestones', () => {
    it('should detect Phase milestones', () => {
      const tasks = [
        createTask('Phase 1: Setup'),
        createTask('Phase 2: Implementation'),
      ];

      const milestones = detector.detectMilestones(tasks);

      expect(milestones.length).toBe(2);
      expect(milestones[0].type).toBe(MilestoneType.PHASE);
      expect(milestones[0].name).toContain('1');
    });

    it('should detect Japanese Phase milestones', () => {
      const tasks = [createTask('フェーズ 1: 初期化')];

      const milestones = detector.detectMilestones(tasks);

      expect(milestones.length).toBe(1);
      expect(milestones[0].type).toBe(MilestoneType.PHASE);
    });

    it('should detect Setup milestones', () => {
      const tasks = [
        createTask('Setup project structure'),
        createTask('セットアップ完了'),
      ];

      const milestones = detector.detectMilestones(tasks);

      expect(milestones.length).toBeGreaterThan(0);
      expect(milestones.some((m) => m.type === MilestoneType.CHECKPOINT)).toBe(
        true
      );
    });

    it('should detect Implementation milestones', () => {
      const tasks = [
        createTask('Implement feature A'),
        createTask('実装: 機能B'),
      ];

      const milestones = detector.detectMilestones(tasks);

      expect(milestones.length).toBeGreaterThan(0);
      expect(milestones.some((m) => m.type === MilestoneType.FEATURE)).toBe(
        true
      );
    });

    it('should detect Testing milestones', () => {
      const tasks = [createTask('Test the application'), createTask('テスト実行')];

      const milestones = detector.detectMilestones(tasks);

      expect(milestones.length).toBeGreaterThan(0);
    });

    it('should detect Release milestones', () => {
      const tasks = [createTask('Release v1.0'), createTask('リリース準備')];

      const milestones = detector.detectMilestones(tasks);

      expect(milestones.length).toBeGreaterThan(0);
      expect(milestones.some((m) => m.type === MilestoneType.RELEASE)).toBe(
        true
      );
    });

    it('should not create duplicate milestones', () => {
      const tasks = [
        createTask('Phase 1: Task A'),
        createTask('Phase 1: Task B'),
        createTask('Phase 1: Task C'),
      ];

      const milestones = detector.detectMilestones(tasks);

      expect(milestones.length).toBe(1);
      expect(milestones[0].taskIds.length).toBe(3);
    });

    it('should handle tasks with no milestone patterns', () => {
      const tasks = [createTask('Random task'), createTask('Another task')];

      const milestones = detector.detectMilestones(tasks);

      expect(milestones.length).toBe(0);
    });
  });

  describe('groupTasksByMilestone', () => {
    it('should group tasks by detected milestones', () => {
      const tasks = [
        createTask('Phase 1: Task A'),
        createTask('Phase 1: Task B'),
        createTask('Phase 2: Task C'),
      ];

      const grouped = detector.groupTasksByMilestone(tasks);

      expect(grouped.size).toBe(2);
    });
  });

  describe('calculateMilestoneStatus', () => {
    it('should calculate COMPLETED status when all tasks done', () => {
      const tasks = [
        createTask('Task 1', TaskStatus.COMPLETED),
        createTask('Task 2', TaskStatus.COMPLETED),
      ];

      const milestone = {
        id: 'test_milestone',
        name: 'Test Milestone',
        type: MilestoneType.FEATURE,
        status: TaskStatus.PENDING,
        taskIds: tasks.map((t) => t.id),
      };

      const updated = detector.calculateMilestoneStatus(milestone, tasks);

      expect(updated.status).toBe(TaskStatus.COMPLETED);
      expect(updated.completedDate).toBeDefined();
    });

    it('should calculate IN_PROGRESS status when tasks active', () => {
      const tasks = [
        createTask('Task 1', TaskStatus.COMPLETED),
        createTask('Task 2', TaskStatus.IN_PROGRESS),
        createTask('Task 3', TaskStatus.PENDING),
      ];

      const milestone = {
        id: 'test_milestone',
        name: 'Test Milestone',
        type: MilestoneType.FEATURE,
        status: TaskStatus.PENDING,
        taskIds: tasks.map((t) => t.id),
      };

      const updated = detector.calculateMilestoneStatus(milestone, tasks);

      expect(updated.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should calculate BLOCKED status when tasks blocked', () => {
      const tasks = [
        createTask('Task 1', TaskStatus.BLOCKED),
        createTask('Task 2', TaskStatus.PENDING),
      ];

      const milestone = {
        id: 'test_milestone',
        name: 'Test Milestone',
        type: MilestoneType.FEATURE,
        status: TaskStatus.PENDING,
        taskIds: tasks.map((t) => t.id),
      };

      const updated = detector.calculateMilestoneStatus(milestone, tasks);

      expect(updated.status).toBe(TaskStatus.BLOCKED);
    });
  });

  describe('custom rules', () => {
    it('should add custom detection rule', () => {
      detector.addRule({
        id: 'custom-rule',
        name: 'Custom Pattern',
        pattern: /^CUSTOM:/,
        type: MilestoneType.CUSTOM,
        autoCreate: true,
      });

      const tasks = [createTask('CUSTOM: Task 1')];
      const milestones = detector.detectMilestones(tasks);

      expect(milestones.length).toBe(1);
      expect(milestones[0].type).toBe(MilestoneType.CUSTOM);
    });

    it('should remove detection rule', () => {
      const rules = detector.getRules();
      const initialCount = rules.length;

      detector.removeRule(rules[0].id);

      expect(detector.getRules().length).toBe(initialCount - 1);
    });

    it('should get all rules', () => {
      const rules = detector.getRules();
      expect(rules.length).toBeGreaterThan(0);
    });
  });

  describe('suggestGroupings', () => {
    it('should suggest groupings by common prefix', () => {
      const tasks = [
        createTask('Implement feature A'),
        createTask('Implement feature B'),
        createTask('Implement feature C'),
      ];

      const suggestions = detector.suggestGroupings(tasks);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].taskIds.length).toBe(3);
    });

    it('should suggest high priority grouping', () => {
      const tasks = [
        createTask('Task 1'),
        createTask('Task 2'),
      ];
      tasks[0].priority = Priority.HIGH;
      tasks[1].priority = Priority.CRITICAL;

      const suggestions = detector.suggestGroupings(tasks);

      const highPriorityGroup = suggestions.find((s) =>
        s.name.includes('High Priority')
      );
      expect(highPriorityGroup).toBeDefined();
    });

    it('should return suggestions sorted by confidence', () => {
      const tasks = [
        createTask('Implement A'),
        createTask('Implement B'),
        createTask('Test X'),
      ];

      const suggestions = detector.suggestGroupings(tasks);

      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].confidence).toBeGreaterThanOrEqual(
          suggestions[i].confidence
        );
      }
    });
  });

  describe('generateReport', () => {
    it('should generate milestone report', () => {
      const tasks = [
        createTask('Phase 1: Task A', TaskStatus.COMPLETED),
        createTask('Phase 1: Task B', TaskStatus.IN_PROGRESS),
      ];

      const milestones = detector.detectMilestones(tasks);
      const report = detector.generateReport(milestones, tasks);

      expect(report).toContain('Milestone Report');
      expect(report).toContain('Phase');
      expect(report).toContain('Progress');
    });
  });

  describe('clearCache', () => {
    it('should clear detection cache', () => {
      const tasks = [createTask('Phase 1: Setup')];
      detector.detectMilestones(tasks);

      detector.clearCache();

      // Should re-detect after clearing cache
      const milestones = detector.detectMilestones(tasks);
      expect(milestones.length).toBe(1);
    });
  });
});
