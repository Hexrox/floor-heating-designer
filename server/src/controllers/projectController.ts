import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ProjectModel } from '../models/Project';
import { DrawingModel } from '../models/Drawing';
import { FloorPlanModel } from '../models/FloorPlan';

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const userId = req.userId!;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = await ProjectModel.create({
      user_id: userId,
      name,
      description,
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const projects = await ProjectModel.findByUserId(userId);
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProject = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.userId!;

    const project = await ProjectModel.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check ownership
    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get associated data
    const drawing = await DrawingModel.findByProjectId(projectId);
    const floorPlan = await FloorPlanModel.findByProjectId(projectId);

    res.json({
      ...project,
      drawing,
      floorPlan,
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.userId!;
    const { name, description } = req.body;

    // Check ownership
    const isOwner = await ProjectModel.checkOwnership(projectId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedProject = await ProjectModel.update(projectId, { name, description });

    if (!updatedProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.userId!;

    // Check ownership
    const isOwner = await ProjectModel.checkOwnership(projectId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const deleted = await ProjectModel.delete(projectId);

    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const saveDrawing = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.userId!;
    const { canvas_data, parameters, loops_data } = req.body;

    // Check ownership
    const isOwner = await ProjectModel.checkOwnership(projectId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const drawing = await DrawingModel.upsert({
      project_id: projectId,
      canvas_data,
      parameters,
      loops_data,
    });

    res.json(drawing);
  } catch (error) {
    console.error('Save drawing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
