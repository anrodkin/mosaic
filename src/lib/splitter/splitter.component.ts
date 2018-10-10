import {
    ChangeDetectionStrategy,
    Component,
    Input,
    NgZone,
    OnDestroy,
    Renderer2,
    ViewEncapsulation
} from "@angular/core";

import { McSplitterAreaDirective } from "./splitter-area.directive";

import { Direction } from "./splitter.constants";
import { IArea, IPoint } from "./splitter.interfaces";


@Component({
    selector: 'mc-splitter',
    preserveWhitespaces: false,
    styleUrls: ['splitter.css'],
    templateUrl: './splitter.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class McSplitterComponent implements OnDestroy {
    private _direction: Direction = Direction.Horizontal;
    private _disabled: boolean = false;
    private _gutterSize: number = 12;

    private isDragging: boolean = false;

    private readonly areaPositionDivider: number = 2;
    private readonly areas: IArea[] = [];
    private readonly dragListeners: (() => void)[] = [];

    @Input()
    set direction(direction: Direction) {
        this._direction = direction;
    }

    get direction(): Direction {
        return this._direction;
    }

    @Input()
    set disabled(disabled: boolean) {
        this._disabled = `${disabled}` === 'true' || `${disabled}` === '';
    }

    get disabled(): boolean {
        return this._disabled;
    }

    @Input()
    set gutterSize(gutterSize: number) {
        const size = Number(gutterSize);
        this.gutterSize = (!isNaN(size) && size > 0) ? size : this.gutterSize;
    }

    get gutterSize(): number {
        return this._gutterSize;
    }

    constructor(private ngZone: NgZone,
                private renderer: Renderer2) {}

    ngOnDestroy(): void {
        return;
    }

    // public funcs
    addArea(area: McSplitterAreaDirective): void {
        const index: number = this.areas.length;

        this.areas.push({
            area,
            index,
            order: index * this.areaPositionDivider
        });

        this.refresh();
    }

    refresh() {
        this.areas.forEach((item, index) => {
            item.order = index * this.areaPositionDivider; // save space for gutters
            item.area.setOrder(item.order);

            console.log(item.area.getSize(this.direction));
        });
    }

    removeArea(area: McSplitterAreaDirective): void {
        const foundArea: IArea = <IArea> this.areas.find((a) => a.area === area);
        this.areas.splice(foundArea.index, 1);
    }

    dragStart() {
        console.log('dragstart');

        const sizeStep: number = 50;
        const areaSize0 = this.areas[0].area.getSize(this.direction) - sizeStep;
        const areaSize1 = this.areas[1].area.getSize(this.direction) + sizeStep;

        this.areas[0].area.setSize(areaSize0, this.direction);
        this.areas[1].area.setSize(areaSize1, this.direction);

        this.areas.forEach((item) => {
            console.log(item.area.getSize(this.direction));
        })
    }

    dragEnd() {
        console.log('dragend');

    }

    onMouseDown(event: MouseEvent, leftAreaIndex: number, rightAreaIndex: number) {
        console.log('mousedown');

        const leftItem = this.areas[leftAreaIndex];
        const rightArea = this.areas[rightAreaIndex];

        const startPoint: IPoint = {
            x: event.screenX,
            y: event.screenY
        };

        this.ngZone.runOutsideAngular(() => {
           this.dragListeners.push(
               this.renderer.listen(
                   'document',
                   'mouseup',
                   (e: MouseEvent) => this.onMouseUp(e, startPoint, leftItem, rightArea)
               )
           );
        });

        if (this.disabled) {
            return;
        }

        this.isDragging = true;

        this.ngZone.runOutsideAngular((() => {
            this.dragListeners.push(
                this.renderer.listen(
                    'document',
                    'mousemove',
                    (e: MouseEvent) => this.onMouseMove(e, startPoint, leftItem, rightArea)
                )
            );
        }))
    }

    onMouseMove(event: MouseEvent, startPoint: IPoint, leftArea: IArea, rightArea: IArea) {
        if (!this.isDragging) {
            return;
        }

        return;

        const endPoint: IPoint = {
            x: event.screenX,
            y: event.screenY
        }

        const offset = this.direction === Direction.Vertical
            ? startPoint.y - endPoint.y
            : startPoint.x - endPoint.x;

        const leftAreaSize = leftArea.area.getSize(this.direction);
        const rightAreaSize = rightArea.area.getSize(this.direction);

        leftArea.area.setSize(leftAreaSize - offset, this.direction);
        rightArea.area.setSize(rightAreaSize - offset, this.direction);

        console.log('mousemove');
    }

    onMouseUp(event: MouseEvent, startPoint: IPoint, leftArea: IArea, rightArea: IArea) {
        console.log('mouseup');

        if (!this.isDragging) {
            return;
        }

        const endPoint: IPoint = {
            x: event.screenX,
            y: event.screenY
        }

        console.log(startPoint);
        console.log(endPoint);

        const offset = this.direction === Direction.Vertical
            ? startPoint.y - endPoint.y
            : startPoint.x - endPoint.x;

        const leftAreaSize = leftArea.area.getSize(this.direction);
        const rightAreaSize = rightArea.area.getSize(this.direction);

        leftArea.area.setSize(leftAreaSize - offset, this.direction);
        rightArea.area.setSize(rightAreaSize + offset, this.direction);

        this.isDragging = false;
    }

    // private funcs
    private getGuttersCount(): number {
        return this.areas.length - 1;
    }


}
