import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Item } from '../../../../shared/models/item.model';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe],
  templateUrl: './item-card.html',
  styleUrl: './item-card.scss',
})
export class ItemCard {
  item = input.required<Item>();
  canDecrement = input(false);
  isAdmin = input(false);

  cardClick = output<Item>();
  delete = output<Item>();
  increment = output<Item>();
  decrement = output<Item>();
  uploadPicture = output<{ item: Item; file: File }>();

  get imageUrl(): string {
    const img = this.item().image;
    if (!img) return '';
    if (img.startsWith('http') || img.startsWith('/')) return img;
    return `/${img}`;
  }

  get stockLabel(): string {
    const quantite = this.item().quantity;
    if (quantite <= 2) return 'ITEMS.STOCK_CRITICAL';
    if (quantite < 5) return 'ITEMS.STOCK_LOW';
    return 'ITEMS.STOCK_OK';
  }

  get stockMod(): string {
    const quantity = this.item().quantity;
    if (quantity <= 2) return 'urgent';
    if (quantity < 5) return 'limite';
    return 'ok';
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.uploadPicture.emit({ item: this.item(), file });
  }
}
