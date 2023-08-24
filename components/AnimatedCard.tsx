import Image from "next/image";

import one from "@/images/1111.webp";
import two from "@/images/2222.webp";
import three from "@/images/3333.webp";

export function AnimatedCard() {
  return (
    <div id="cards" className="flex justify-evenly">
      <div className="card" data-color="blue">
        <Image
          alt=""
          width={320}
          height={480}
          className="card-front-image card-image"
          src={one.src}
        />
        <div className="card-faders">
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={one.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={one.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={one.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={one.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={one.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={one.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={one.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={one.src}
          />
        </div>
      </div>
      <div className="card" data-color="green">
        <Image
          alt=""
          width={320}
          height={480}
          className="card-front-image card-image"
          src={two.src}
        />
        <div className="card-faders">
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={two.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={two.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={two.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={two.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={two.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={two.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={two.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={two.src}
          />
        </div>
      </div>
      <div className="card" data-color="brown">
        <Image
          alt=""
          width={320}
          height={480}
          className="card-front-image card-image"
          src={three.src}
        />
        <div className="card-faders">
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={three.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={three.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={three.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={three.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={three.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={three.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={three.src}
          />
          <Image
            alt=""
            width={320}
            height={480}
            className="card-fader card-image"
            src={three.src}
          />
        </div>
      </div>
    </div>
  );
}
