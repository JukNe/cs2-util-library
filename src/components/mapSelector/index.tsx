import Link from 'next/link';
import './style.scss'
import Image from 'next/image'

const MapSelector = () => {
    //TODO maybe add number of nades under map name
    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: 'navy', marginBottom: '3em', padding: '1em 0' }}><h3>Epic util shit</h3></div>
            <div className={'map-grid'}>
                <Link className={'map-item'} href={'/dust2'} style={{ backgroundImage: "url('/dust2_poster.webp')" }}><Image className={'map-item-icon'} unoptimized alt='' height={0} width={0} src={'/dust2_icon.webp'} style={{ height: '5em', width: '5em' }} /><div className={'map-item-inner'}>Dust2</div></Link>
                <Link className={'map-item'} href={'/mirage'} style={{ backgroundImage: "url('/mirage_poster.webp')" }}><Image className={'map-item-icon'} unoptimized alt='' height={0} width={0} src={'/mirage_icon.webp'} style={{ height: '5em', width: '5em' }} /><div className={'map-item-inner'}>Mirage</div></Link>
                <Link className={'map-item'} href={'/nuke'} style={{ backgroundImage: "url('/nuke_poster.webp')" }}><Image className={'map-item-icon'} unoptimized alt='' height={0} width={0} src={'/nuke_icon.webp'} style={{ height: '5em', width: '5em' }} /><div className={'map-item-inner'}>Nuke</div></Link>
                <Link className={'map-item'} href={'/inferno'} style={{ backgroundImage: "url('/inferno_poster.webp')" }}><Image className={'map-item-icon'} unoptimized alt='' height={0} width={0} src={'/inferno_icon.webp'} style={{ height: '5em', width: '5em' }} /><div className={'map-item-inner'}>Inferno</div></Link>
                <Link className={'map-item'} href={'/ancient'} style={{ backgroundImage: "url('/ancient_poster.webp')" }}><Image className={'map-item-icon'} unoptimized alt='' height={0} width={0} src={'/ancient_icon.webp'} style={{ height: '5em', width: '5em' }} /><div className={'map-item-inner'}>Ancient</div></Link>
                <Link className={'map-item'} href={'/anubis'} style={{ backgroundImage: "url('/anubis_poster.webp')" }}><Image className={'map-item-icon'} unoptimized alt='' height={0} width={0} src={'/anubis_icon.webp'} style={{ height: '5em', width: '5em' }} /><div className={'map-item-inner'}>Anubis</div></Link>
                <Link className={'map-item'} href={'/vertigo'} style={{ backgroundImage: "url('/vertigo_poster.webp')" }}><Image className={'map-item-icon'} unoptimized alt='' height={0} width={0} src={'/vertigo_icon.webp'} style={{ height: '5em', width: '5em' }} /><div className={'map-item-inner'}>Vertigo</div></Link>
                <Link className={'map-item'} href={'/train'} style={{ backgroundImage: "url('/train_poster.webp')" }}><Image className={'map-item-icon'} unoptimized alt='' height={0} width={0} src={'/train_icon.webp'} style={{ height: '5em', width: '5em' }} /><div className={'map-item-inner'}>Train</div></Link>
            </div>
        </>
    )

}

export default MapSelector;