import Link from "next/link";

type Props = {}

export default function Header(props: Props) {
    const {} = props;
  return (
    <div className='bg-red-600 px-2 text-white items-end md:flex text-xl'>
      <h1 className="text-3xl font-bold mr-4">PAINT<br />ONLINE</h1>
      <ul className="md:flex">
        <li className="mr-2"><Link href="/">Home</Link></li>

      </ul>
    </div>
  )
}