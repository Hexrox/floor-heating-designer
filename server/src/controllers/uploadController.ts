import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ProjectModel } from '../models/Project';
import { FloorPlanModel } from '../models/FloorPlan';
import path from 'path';
import fs from 'fs/promises';

export const uploadFloorPlan = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.userId!;

    // Check ownership
    const isOwner = await ProjectModel.checkOwnership(projectId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Delete old floor plan if exists
    const existingFloorPlan = await FloorPlanModel.findByProjectId(projectId);
    if (existingFloorPlan) {
      try {
        await fs.unlink(path.join(process.cwd(), existingFloorPlan.image_path));
      } catch (err) {
        console.error('Error deleting old file:', err);
      }
      await FloorPlanModel.delete(projectId);
    }

    // Save new floor plan
    const imagePath = req.file.path.replace(/\\/g, '/'); // Normalize path for cross-platform
    const floorPlan = await FloorPlanModel.create({
      project_id: projectId,
      image_path: imagePath,
      original_name: req.file.originalname,
    });

    res.status(201).json({
      ...floorPlan,
      url: `/uploads/${path.basename(imagePath)}`,
    });
  } catch (error) {
    console.error('Upload floor plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteFloorPlan = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.userId!;

    // Check ownership
    const isOwner = await ProjectModel.checkOwnership(projectId, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const floorPlan = await FloorPlanModel.findByProjectId(projectId);
    if (!floorPlan) {
      return res.status(404).json({ error: 'Floor plan not found' });
    }

    // Delete file
    try {
      await fs.unlink(path.join(process.cwd(), floorPlan.image_path));
    } catch (err) {
      console.error('Error deleting file:', err);
    }

    // Delete from database
    await FloorPlanModel.delete(projectId);

    res.json({ message: 'Floor plan deleted successfully' });
  } catch (error) {
    console.error('Delete floor plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
