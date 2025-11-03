/**
 * Progress Tracker
 *
 * Main class for tracking and visualizing task progress in Orchestra.
 * Manages tasks, milestones, and provides tree visualization.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  Task,
  TaskStatus,
  Milestone,
  ProgressStats,
  ProgressTrackerConfig,
  TodoWriteData,
  TreeNode,
  TaskMetadata,
  ErrorType,
  ProgressTrackerError,
  EventType,
  ProgressEvent,
  EventListener,
  Priority,
  isTodoWriteData,
} from '../types/progress-tracker.types';
import { DEFAULT_CONFIG, LIMITS } from '../config/progress-tracker-defaults';
import { TreeRenderer } from './tree-renderer';

/**
 * Main ProgressTracker class
 */
export class ProgressTracker {
  private tasks: Map<string, Task>;
  private milestones: Map<string, Milestone>;
  private config: ProgressTrackerConfig;
  private renderer: TreeRenderer;
  private eventListeners: Map<EventType, Set<EventListener>>;
  private taskIdCounter: number;

  constructor(config?: Partial<ProgressTrackerConfig>) {
    this.tasks = new Map();
    this.milestones = new Map();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.renderer = new TreeRenderer(this.config.renderOptions);
    this.eventListeners = new Map();
    this.taskIdCounter = 0;

    // Load persisted state if enabled
    if (this.config.persistState) {
      this.loadState();
    }
  }

  /**
   * Add a new task
   * @param content - Task content (imperative form)
   * @param activeForm - Active form of the task
   * @param options - Additional task options
   * @returns Created task ID
   */
  public addTask(
    content: string,
    activeForm: string,
    options?: {
      status?: TaskStatus;
      priority?: Priority;
      parentId?: string;
      milestoneId?: string;
      metadata?: Partial<TaskMetadata>;
    }
  ): string {
    // Validate content length
    if (content.length > LIMITS.MAX_TASK_CONTENT_LENGTH) {
      throw new ProgressTrackerError(
        ErrorType.VALIDATION_ERROR,
        `Task content exceeds maximum length of ${LIMITS.MAX_TASK_CONTENT_LENGTH}`,
        { content }
      );
    }

    // Check task limit
    if (this.tasks.size >= this.config.maxTasks) {
      throw new ProgressTrackerError(
        ErrorType.VALIDATION_ERROR,
        `Maximum number of tasks (${this.config.maxTasks}) reached`,
        { taskCount: this.tasks.size }
      );
    }

    // Generate unique ID
    const id = this.generateTaskId();

    // Validate parent task exists
    if (options?.parentId && !this.tasks.has(options.parentId)) {
      throw new ProgressTrackerError(
        ErrorType.INVALID_TASK_ID,
        `Parent task not found: ${options.parentId}`,
        { parentId: options.parentId }
      );
    }

    // Validate milestone exists
    if (options?.milestoneId && !this.milestones.has(options.milestoneId)) {
      throw new ProgressTrackerError(
        ErrorType.MILESTONE_NOT_FOUND,
        `Milestone not found: ${options.milestoneId}`,
        { milestoneId: options.milestoneId }
      );
    }

    // Check for circular dependencies
    if (options?.parentId) {
      this.validateNoCircularDependency(id, options.parentId);
    }

    const now = Date.now();
    const task: Task = {
      id,
      content,
      activeForm,
      status: options?.status || TaskStatus.PENDING,
      priority: options?.priority,
      parentId: options?.parentId,
      milestoneId: options?.milestoneId,
      metadata: {
        createdAt: now,
        updatedAt: now,
        ...options?.metadata,
      },
      children: [],
    };

    this.tasks.set(id, task);

    // Update parent's children array
    if (options?.parentId) {
      const parent = this.tasks.get(options.parentId);
      if (parent && parent.children) {
        parent.children.push(id);
      }
    }

    // Update milestone's task list
    if (options?.milestoneId) {
      const milestone = this.milestones.get(options.milestoneId);
      if (milestone) {
        milestone.taskIds.push(id);
      }
    }

    this.emit(EventType.TASK_ADDED, { task });
    this.persistState();

    return id;
  }

  /**
   * Update task status
   * @param taskId - Task ID
   * @param status - New status
   */
  public updateTaskStatus(taskId: string, status: TaskStatus): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new ProgressTrackerError(
        ErrorType.INVALID_TASK_ID,
        `Task not found: ${taskId}`,
        { taskId }
      );
    }

    const oldStatus = task.status;
    task.status = status;
    task.metadata.updatedAt = Date.now();

    // Update timing metadata
    if (status === TaskStatus.IN_PROGRESS && !task.metadata.startedAt) {
      task.metadata.startedAt = Date.now();
    } else if (status === TaskStatus.COMPLETED && !task.metadata.completedAt) {
      task.metadata.completedAt = Date.now();
      if (task.metadata.startedAt) {
        task.metadata.actualDuration =
          task.metadata.completedAt - task.metadata.startedAt;
      }
    }

    this.emit(EventType.TASK_STATUS_CHANGED, {
      taskId,
      oldStatus,
      newStatus: status,
    });
    this.emit(EventType.TASK_UPDATED, { task });
    this.persistState();
  }

  /**
   * Update task content
   * @param taskId - Task ID
   * @param content - New content
   * @param activeForm - New active form (optional)
   */
  public updateTaskContent(
    taskId: string,
    content: string,
    activeForm?: string
  ): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new ProgressTrackerError(
        ErrorType.INVALID_TASK_ID,
        `Task not found: ${taskId}`,
        { taskId }
      );
    }

    task.content = content;
    if (activeForm) {
      task.activeForm = activeForm;
    }
    task.metadata.updatedAt = Date.now();

    this.emit(EventType.TASK_UPDATED, { task });
    this.persistState();
  }

  /**
   * Remove a task
   * @param taskId - Task ID
   * @param removeChildren - Whether to remove children (default: false)
   */
  public removeTask(taskId: string, removeChildren = false): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new ProgressTrackerError(
        ErrorType.INVALID_TASK_ID,
        `Task not found: ${taskId}`,
        { taskId }
      );
    }

    // Handle children
    if (task.children && task.children.length > 0) {
      if (removeChildren) {
        // Recursively remove all children
        for (const childId of task.children) {
          this.removeTask(childId, true);
        }
      } else {
        // Re-parent children to this task's parent
        for (const childId of task.children) {
          const child = this.tasks.get(childId);
          if (child) {
            child.parentId = task.parentId;
            // Add to new parent's children array
            if (task.parentId) {
              const newParent = this.tasks.get(task.parentId);
              if (newParent && newParent.children) {
                if (!newParent.children.includes(childId)) {
                  newParent.children.push(childId);
                }
              }
            }
          }
        }
      }
    }

    // Remove from parent's children array
    if (task.parentId) {
      const parent = this.tasks.get(task.parentId);
      if (parent && parent.children) {
        parent.children = parent.children.filter((id) => id !== taskId);
      }
    }

    // Remove from milestone
    if (task.milestoneId) {
      const milestone = this.milestones.get(task.milestoneId);
      if (milestone) {
        milestone.taskIds = milestone.taskIds.filter((id) => id !== taskId);
      }
    }

    this.tasks.delete(taskId);

    this.emit(EventType.TASK_REMOVED, { taskId });
    this.persistState();
  }

  /**
   * Get a task by ID
   * @param taskId - Task ID
   * @returns Task or undefined
   */
  public getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   * @returns Array of all tasks
   */
  public getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get root tasks (tasks without parents)
   * @returns Array of root tasks
   */
  public getRootTasks(): Task[] {
    return Array.from(this.tasks.values()).filter((task) => !task.parentId);
  }

  /**
   * Process TodoWrite data and update tasks
   * @param data - TodoWrite data
   */
  public processTodoWrite(data: TodoWriteData): void {
    if (!isTodoWriteData(data)) {
      throw new ProgressTrackerError(
        ErrorType.VALIDATION_ERROR,
        'Invalid TodoWrite data format',
        { data }
      );
    }

    // Clear existing tasks (simple approach - could be more sophisticated)
    this.tasks.clear();

    // Add tasks from TodoWrite data
    for (const todo of data.todos) {
      const status = this.mapTodoStatus(todo.status);
      this.addTask(todo.content, todo.activeForm, { status });
    }
  }

  /**
   * Calculate progress statistics
   * @returns Progress statistics
   */
  public getProgressStats(): ProgressStats {
    const tasks = Array.from(this.tasks.values());
    const total = tasks.length;

    const statusCounts = {
      completed: 0,
      inProgress: 0,
      pending: 0,
      blocked: 0,
      failed: 0,
    };

    for (const task of tasks) {
      switch (task.status) {
        case TaskStatus.COMPLETED:
          statusCounts.completed++;
          break;
        case TaskStatus.IN_PROGRESS:
          statusCounts.inProgress++;
          break;
        case TaskStatus.PENDING:
          statusCounts.pending++;
          break;
        case TaskStatus.BLOCKED:
          statusCounts.blocked++;
          break;
        case TaskStatus.FAILED:
          statusCounts.failed++;
          break;
      }
    }

    const completionRate = total > 0 ? statusCounts.completed / total : 0;

    return {
      total,
      ...statusCounts,
      completionRate,
    };
  }

  /**
   * Render the progress tree
   * @returns Rendered tree string
   */
  public render(): string {
    const rootNodes = this.buildTreeNodes();
    return this.renderer.render(rootNodes);
  }

  /**
   * Build tree nodes from tasks
   */
  private buildTreeNodes(): TreeNode[] {
    const rootTasks = this.getRootTasks();
    return rootTasks.map((task) => this.buildTreeNode(task, 0, [], true));
  }

  /**
   * Build a tree node recursively
   */
  private buildTreeNode(
    task: Task,
    depth: number,
    parentChain: boolean[],
    isLast: boolean
  ): TreeNode {
    const children: TreeNode[] = [];

    if (task.children && task.children.length > 0) {
      for (let i = 0; i < task.children.length; i++) {
        const childTask = this.tasks.get(task.children[i]);
        if (childTask) {
          const childIsLast = i === task.children.length - 1;
          children.push(
            this.buildTreeNode(
              childTask,
              depth + 1,
              [...parentChain, !isLast],
              childIsLast
            )
          );
        }
      }
    }

    return {
      task,
      children,
      depth,
      isLast,
      parentChain,
    };
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    this.taskIdCounter++;
    return `task_${Date.now()}_${this.taskIdCounter}`;
  }

  /**
   * Map TodoWrite status to TaskStatus
   */
  private mapTodoStatus(
    status: 'pending' | 'in_progress' | 'completed'
  ): TaskStatus {
    switch (status) {
      case 'pending':
        return TaskStatus.PENDING;
      case 'in_progress':
        return TaskStatus.IN_PROGRESS;
      case 'completed':
        return TaskStatus.COMPLETED;
      default:
        return TaskStatus.PENDING;
    }
  }

  /**
   * Validate no circular dependency exists
   */
  private validateNoCircularDependency(taskId: string, parentId: string): void {
    const visited = new Set<string>();
    let currentId: string | undefined = parentId;

    while (currentId) {
      if (currentId === taskId) {
        throw new ProgressTrackerError(
          ErrorType.CIRCULAR_DEPENDENCY,
          'Circular dependency detected',
          { taskId, parentId }
        );
      }

      if (visited.has(currentId)) {
        break;
      }

      visited.add(currentId);
      const currentTask = this.tasks.get(currentId);
      currentId = currentTask?.parentId;
    }
  }

  /**
   * Persist state to file
   */
  private persistState(): void {
    if (!this.config.persistState || !this.config.stateFilePath) {
      return;
    }

    try {
      const stateDir = path.dirname(this.config.stateFilePath);
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }

      const state = {
        version: '1.0.0',
        timestamp: Date.now(),
        tasks: Object.fromEntries(this.tasks),
        milestones: Object.fromEntries(this.milestones),
        config: this.config,
        stats: this.getProgressStats(),
      };

      fs.writeFileSync(
        this.config.stateFilePath,
        JSON.stringify(state, null, 2),
        'utf8'
      );

      this.emit(EventType.STATE_SAVED, { filePath: this.config.stateFilePath });
    } catch (error) {
      throw new ProgressTrackerError(
        ErrorType.PERSISTENCE_ERROR,
        'Failed to persist state',
        { error, filePath: this.config.stateFilePath }
      );
    }
  }

  /**
   * Load state from file
   */
  private loadState(): void {
    if (!this.config.persistState || !this.config.stateFilePath) {
      return;
    }

    try {
      if (!fs.existsSync(this.config.stateFilePath)) {
        return;
      }

      const data = fs.readFileSync(this.config.stateFilePath, 'utf8');
      const state = JSON.parse(data);

      this.tasks = new Map(Object.entries(state.tasks));
      this.milestones = new Map(Object.entries(state.milestones));

      this.emit(EventType.STATE_LOADED, { filePath: this.config.stateFilePath });
    } catch (error) {
      throw new ProgressTrackerError(
        ErrorType.PERSISTENCE_ERROR,
        'Failed to load state',
        { error, filePath: this.config.stateFilePath }
      );
    }
  }

  /**
   * Register event listener
   */
  public on<T = unknown>(type: EventType, listener: EventListener<T>): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(listener as EventListener);
  }

  /**
   * Unregister event listener
   */
  public off<T = unknown>(type: EventType, listener: EventListener<T>): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener as EventListener);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit<T = unknown>(type: EventType, data: T): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const event: ProgressEvent<T> = {
        type,
        timestamp: Date.now(),
        data,
      };
      listeners.forEach((listener) => listener(event));
    }
  }

  /**
   * Clear all tasks
   */
  public clear(): void {
    this.tasks.clear();
    this.milestones.clear();
    this.persistState();
  }

  /**
   * Get configuration
   */
  public getConfig(): ProgressTrackerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ProgressTrackerConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.renderOptions) {
      this.renderer.updateOptions(config.renderOptions);
    }
  }
}
