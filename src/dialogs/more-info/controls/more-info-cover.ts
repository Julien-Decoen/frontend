import { mdiArrowExpandVertical, mdiPanVertical } from "@mdi/js";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  nothing,
  PropertyValues,
} from "lit";
import { customElement, property, state } from "lit/decorators";
import { computeStateDisplay } from "../../../common/entity/compute_state_display";
import { supportsFeature } from "../../../common/entity/supports-feature";
import { blankBeforePercent } from "../../../common/translations/blank_before_percent";
import "../../../components/ha-attributes";
import { CoverEntity, CoverEntityFeature } from "../../../data/cover";
import type { HomeAssistant } from "../../../types";
import "../components/cover/ha-more-info-cover-actions";
import "../components/cover/ha-more-info-cover-position";
import "../components/cover/ha-more-info-cover-tilt-position";
import { moreInfoControlStyle } from "../components/ha-more-info-control-style";
import "../components/ha-more-info-state-header";

@customElement("more-info-cover")
class MoreInfoCover extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public stateObj?: CoverEntity;

  @state() private _displayedPosition?: number;

  @state() private _mode?: "position" | "button";

  private _toggleMode() {
    this._mode = this._mode === "position" ? "button" : "position";
  }

  private _positionChanged(ev) {
    const value = (ev.detail as any).value;
    if (isNaN(value)) return;
    this._displayedPosition = value;
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has("stateObj") && this.stateObj) {
      if (supportsFeature(this.stateObj, CoverEntityFeature.SET_POSITION)) {
        const currentPosition = this.stateObj?.attributes.current_position;
        this._displayedPosition =
          currentPosition != null ? Math.round(currentPosition) : undefined;
      }
      if (!this._mode) {
        this._mode =
          supportsFeature(this.stateObj, CoverEntityFeature.SET_POSITION) ||
          supportsFeature(this.stateObj, CoverEntityFeature.SET_TILT_POSITION)
            ? "position"
            : "button";
      }
    }
  }

  private get _stateOverride() {
    if (this._displayedPosition == null) return undefined;

    const tempState = {
      ...this.stateObj,
      state: this._displayedPosition ? "open" : "closed",
      attributes: {
        ...this.stateObj!.attributes,
        current_position: this._displayedPosition,
      },
    } as CoverEntity;

    const stateDisplay = computeStateDisplay(
      this.hass.localize,
      tempState!,
      this.hass.locale,
      this.hass.entities
    );

    return this._displayedPosition && this._displayedPosition !== 100
      ? `${stateDisplay} - ${Math.round(
          this._displayedPosition
        )}${blankBeforePercent(this.hass!.locale)}%`
      : stateDisplay;
  }

  protected render() {
    if (!this.hass || !this.stateObj) {
      return nothing;
    }

    const supportsPosition = supportsFeature(
      this.stateObj,
      CoverEntityFeature.SET_POSITION
    );

    const supportsTiltPosition = supportsFeature(
      this.stateObj,
      CoverEntityFeature.SET_TILT_POSITION
    );

    const supportsOpenClose =
      supportsFeature(this.stateObj, CoverEntityFeature.OPEN) ||
      supportsFeature(this.stateObj, CoverEntityFeature.CLOSE) ||
      supportsFeature(this.stateObj, CoverEntityFeature.STOP);

    const supportsTilt =
      supportsFeature(this.stateObj, CoverEntityFeature.OPEN_TILT) ||
      supportsFeature(this.stateObj, CoverEntityFeature.CLOSE_TILT) ||
      supportsFeature(this.stateObj, CoverEntityFeature.STOP_TILT);

    return html`
      <ha-more-info-state-header
        .hass=${this.hass}
        .stateObj=${this.stateObj}
        .stateOverride=${this._stateOverride}
      ></ha-more-info-state-header>
      <div class="controls">
        ${this._mode === "position"
          ? html`
              <div class="mode">
                ${supportsPosition
                  ? html`
                      <ha-more-info-cover-position
                        .stateObj=${this.stateObj}
                        .hass=${this.hass}
                        @slider-moved=${this._positionChanged}
                      ></ha-more-info-cover-position>
                    `
                  : nothing}
                ${supportsTiltPosition
                  ? html`
                      <ha-more-info-cover-tilt-position
                        .stateObj=${this.stateObj}
                        .hass=${this.hass}
                      ></ha-more-info-cover-tilt-position>
                    `
                  : nothing}
              </div>
            `
          : nothing}
        ${this._mode === "button"
          ? html`
              <div class="mode">
                ${supportsOpenClose || supportsTilt
                  ? html`
                      <ha-more-info-cover-actions
                        .stateObj=${this.stateObj}
                        .hass=${this.hass}
                      ></ha-more-info-cover-actions>
                    `
                  : nothing}
              </div>
            `
          : nothing}
        ${(supportsPosition || supportsTiltPosition) &&
        (supportsOpenClose || supportsTilt)
          ? html`
              <div class="actions">
                <ha-icon-button
                  .label=${this.hass.localize(
                    `ui.dialogs.more_info_control.cover.switch_mode.${
                      this._mode || "position"
                    }`
                  )}
                  .path=${this._mode === "position"
                    ? mdiPanVertical
                    : mdiArrowExpandVertical}
                  @click=${this._toggleMode}
                ></ha-icon-button>
              </div>
            `
          : nothing}
      </div>
      <ha-attributes
        .hass=${this.hass}
        .stateObj=${this.stateObj}
        extra-filters="current_position,current_tilt_position"
      ></ha-attributes>
    `;
  }

  static get styles(): CSSResultGroup {
    return [
      moreInfoControlStyle,
      css`
        .mode {
          display: flex;
          flex-direction: row;
          align-items: center;
        }
        .mode > * {
          margin: 0 8px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "more-info-cover": MoreInfoCover;
  }
}
