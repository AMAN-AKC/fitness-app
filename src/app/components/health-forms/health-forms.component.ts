import { Component, OnInit } from '@angular/core';

export interface HealthFormData {
  age: number;
  height: number;
  weight: number;
  healthConditions: string[];
  medications: string;
  injuries: string;
  goals: string[];
  exerciseFrequency: string;
  dietaryRestrictions: string;
}

@Component({
  selector: 'app-health-forms',
  templateUrl: './health-forms.component.html',
  styleUrls: ['./health-forms.component.css'],
})
export class HealthFormsComponent implements OnInit {
  formData: HealthFormData = {
    age: 28,
    height: 170,
    weight: 75,
    healthConditions: [],
    medications: '',
    injuries: '',
    goals: ['Weight Loss'],
    exerciseFrequency: '3-4 times/week',
    dietaryRestrictions: 'None',
  };

  healthConditionOptions = [
    'Diabetes',
    'Hypertension',
    'Asthma',
    'Heart Condition',
    'Joint Issues',
    'Back Pain',
  ];
  goalOptions = [
    'Weight Loss',
    'Muscle Gain',
    'Endurance',
    'Flexibility',
    'General Health',
    'Stress Relief',
  ];
  frequencyOptions = [
    'Never',
    '1-2 times/week',
    '3-4 times/week',
    '5+ times/week',
  ];

  bmi = 0;
  submitted = false;

  constructor() {}

  ngOnInit(): void {
    this.calculateBMI();
  }

  calculateBMI(): void {
    const heightInMeters = this.formData.height / 100;
    this.bmi =
      Math.round(
        (this.formData.weight / (heightInMeters * heightInMeters)) * 10,
      ) / 10;
  }

  toggleHealthCondition(condition: string): void {
    const index = this.formData.healthConditions.indexOf(condition);
    if (index > -1) {
      this.formData.healthConditions.splice(index, 1);
    } else {
      this.formData.healthConditions.push(condition);
    }
  }

  toggleGoal(goal: string): void {
    const index = this.formData.goals.indexOf(goal);
    if (index > -1) {
      this.formData.goals.splice(index, 1);
    } else {
      this.formData.goals.push(goal);
    }
  }

  submitForm(): void {
    this.submitted = true;
    console.log('Health Form Submitted:', this.formData);
  }

  resetForm(): void {
    this.formData = {
      age: 28,
      height: 170,
      weight: 75,
      healthConditions: [],
      medications: '',
      injuries: '',
      goals: ['Weight Loss'],
      exerciseFrequency: '3-4 times/week',
      dietaryRestrictions: 'None',
    };
    this.submitted = false;
    this.calculateBMI();
  }

  getBMICategory(): string {
    if (this.bmi < 18.5) return 'Underweight';
    if (this.bmi < 25) return 'Normal';
    if (this.bmi < 30) return 'Overweight';
    return 'Obese';
  }

  getBMIColor(): string {
    if (this.bmi < 18.5) return '#2563EB';
    if (this.bmi < 25) return '#16A34A';
    if (this.bmi < 30) return '#D97706';
    return '#DC2626';
  }
}
