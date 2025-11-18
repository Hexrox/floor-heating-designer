import pool from '../config/database';

export interface FloorPlan {
  id: number;
  project_id: number;
  image_path: string;
  original_name: string;
  width: number | null;
  height: number | null;
  uploaded_at: Date;
}

export interface CreateFloorPlanDTO {
  project_id: number;
  image_path: string;
  original_name: string;
  width?: number;
  height?: number;
}

export class FloorPlanModel {
  static async create(floorPlanData: CreateFloorPlanDTO): Promise<FloorPlan> {
    const { project_id, image_path, original_name, width, height } = floorPlanData;

    const result = await pool.query(
      `INSERT INTO floor_plans (project_id, image_path, original_name, width, height)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [project_id, image_path, original_name, width || null, height || null]
    );

    return result.rows[0];
  }

  static async findByProjectId(projectId: number): Promise<FloorPlan | null> {
    const result = await pool.query(
      'SELECT * FROM floor_plans WHERE project_id = $1',
      [projectId]
    );
    return result.rows[0] || null;
  }

  static async delete(projectId: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM floor_plans WHERE project_id = $1',
      [projectId]
    );
    return result.rowCount! > 0;
  }
}
