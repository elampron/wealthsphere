export interface FamilyMember {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  relationship_type: string;
  is_primary: boolean;
  expected_retirement_age?: number;
  expected_death_age?: number;
} 