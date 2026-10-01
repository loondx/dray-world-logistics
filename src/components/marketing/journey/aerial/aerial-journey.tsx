import { AerialGround } from "./ground";
import { AerialStage } from "./stage";

// The service journey as one aerial map that scrolls natively: the shipment travels
// down the page, so scrolling down moves it forward and scrolling up plays it back.
export function AerialJourney() {
  return (
    <section id="journey" aria-labelledby="journey-title" className="aerial">
      <h2 id="journey-title" className="sr-only">
        The DRAY-WORLD freight journey, from global origin to final delivery
      </h2>
      <AerialStage ground={<AerialGround />} />
    </section>
  );
}
