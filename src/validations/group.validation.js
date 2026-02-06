import { z } from 'zod';

export const _validateGroupData = z.object({
    name: z.string({ required_error: 'Name is required', invalid_type_error: 'Name must be a string' }).min(1, 'Name must be at least 1 character'),
    risk_tolerance: z.enum(['low', 'medium', 'high'], { 
        required_error: 'Risk tolerance is required',
        invalid_type_error: 'Risk tolerance must be one of: low, medium, high'
    }),
    description: z.string().optional(),
    assets: z.array(z.number()).optional()
});
    