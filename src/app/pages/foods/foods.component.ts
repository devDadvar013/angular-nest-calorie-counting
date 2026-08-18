import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FoodService } from '../../services/food.service';
import { CalorieStore } from '../../services/calorie-store.service';
import { FaNumPipe } from '../../pipes/fa-num.pipe';
import { Navbar } from '../../components/navbar/navbar.component';
import { FoodItem } from '../../models/food';

@Component({
  selector: 'app-foods',
  imports: [AsyncPipe, FaNumPipe, Navbar],
  templateUrl: './foods.component.html',
})
export class FoodsPage {
  private readonly foodService = inject(FoodService);
  private readonly store = inject(CalorieStore);
  private readonly router = inject(Router);

  readonly results$ = this.foodService.results$;

  onSearch(event: Event): void {
    this.foodService.setQuery((event.target as HTMLInputElement).value);
  }

  add(item: FoodItem): void {
    const id = this.store.addEntry({
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    });
    // بعد از افزودن، به داشبورد برو و روی همان آیتم اسکرول کن
    this.router.navigate(['/dashboard'], { queryParams: { highlight: id } });
  }
}
