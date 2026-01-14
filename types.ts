
export interface Job {
  id: string;
  title: string;
  organization: string;
  type: 'Government' | 'Private';
  location: string;
  ageLimit: {
    min: number;
    max: number;
  };
  eligibility: string;
  startDate?: string;
  lastDate: string;
  description: string;
  sourceUrl: string;
  isUpcoming: boolean;
}

export interface SearchFilters {
  age: number;
  jobType: 'All' | 'Government' | 'Private';
  location: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}
