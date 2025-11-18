import pool from '../config/database';

export interface Drawing {
  id: number;
  project_id: number;
  canvas_data: any;
  parameters: any;
  loops_data: any;
  updated_at: Date;
}

export interface SaveDrawingDTO {
  project_id: number;
  canvas_data?: any;
  parameters?: any;
  loops_data?: any;
}

export class DrawingModel {
  static async findByProjectId(projectId: number): Promise<Drawing | null> {
    const result = await pool.query(
      'SELECT * FROM drawings WHERE project_id = $1',
      [projectId]
    );
    return result.rows[0] || null;
  }

  static async upsert(drawingData: SaveDrawingDTO): Promise<Drawing> {
    const { project_id, canvas_data, parameters, loops_data } = drawingData;

    const result = await pool.query(
      `INSERT INTO drawings (project_id, canvas_data, parameters, loops_data, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (project_id)
       DO UPDATE SET
         canvas_data = COALESCE($2, drawings.canvas_data),
         parameters = COALESCE($3, drawings.parameters),
         loops_data = COALESCE($4, drawings.loops_data),
         updated_at = NOW()
       RETURNING *`,
      [project_id, canvas_data || null, parameters || null, loops_data || null]
    );

    return result.rows[0];
  }

  static async delete(projectId: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM drawings WHERE project_id = $1',
      [projectId]
    );
    return result.rowCount! > 0;
  }
}
