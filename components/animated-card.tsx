import Image, { ImageProps } from "next/image";

interface AnimatedCardProps {
  width: number;
  height: number;
  items: { src: string; alt: "" }[];
}

export function AnimatedCard(props: AnimatedCardProps) {
  return (
    <div id="cards" className="flex justify-evenly">
      {props.items.map((item, index) => {
        const shadowImages = Array.from({ length: 8 }, (_, index) => (
          <Image
            key={index}
            {...item}
            width={props.width}
            height={props.height}
            className="card-fader card-image"
          />
        ));

        return (
          <div className="card" key={index}>
            <Image
              {...item}
              width={props.width}
              height={props.height}
              className="card-image relative z-10"
            />
            <div className="card-faders">{shadowImages}</div>
          </div>
        );
      })}
    </div>
  );
}
