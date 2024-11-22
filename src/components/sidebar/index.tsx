import Link from "next/link"
import './style.scss'
import Image from 'next/image'

const Sidebar = () => {

    return (
        <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', flex: '0 1 auto' }}>
            <Link href={'/'} ><h3 style={{ whiteSpace: 'nowrap' }}>Epic util finder</h3></Link>
            <Link className="sidebar-link" href={'/dust2'}><div style={{ height: '1.5em' }}><Image className={'map-item-icon'} unoptimized alt='' height={0} width={0} src={'/dust2_icon.webp'} style={{ height: '100%', width: 'auto' }} /></div><div>Dust2</div></Link>
            <Link className="sidebar-link" href={'/mirage'}><div style={{ height: '1.5em' }}><Image className={'map-item-icon'} unoptimized alt='' height={0} width={0} src={'/mirage_icon.webp'} style={{ height: '100%', width: 'auto' }} /></div><div>Mirage</div></Link>
            <Link className="sidebar-link" href={'/nuke'}><div style={{ height: '1.5em' }}><Image className={'map-item-icon'} unoptimized alt='' height={0} width={0} src={'/nuke_icon.webp'} style={{ height: '100%', width: 'auto' }} /></div><div>Nuke</div></Link>
            <Link className="sidebar-link" href={'/inferno'}><div style={{ height: '1.5em' }}><Image className={'map-item-icon'} unoptimized alt='' height={0} width={0} src={'/inferno_icon.webp'} style={{ height: '100%', width: 'auto' }} /></div><div>Inferno</div></Link>
            <Link className="sidebar-link" href={'/ancient'}><div style={{ height: '1.5em' }}><Image className={'map-item-icon'} unoptimized alt='' height={0} width={0} src={'/ancient_icon.webp'} style={{ height: '100%', width: 'auto' }} /></div><div>Ancient</div></Link>
            <Link className="sidebar-link" href={'/anubis'}><div style={{ height: '1.5em' }}><Image className={'map-item-icon'} unoptimized alt='' height={0} width={0} src={'/anubis_icon.webp'} style={{ height: '100%', width: 'auto' }} /></div><div>Anubis</div></Link>
            <Link className="sidebar-link" href={'/vertigo'}><div style={{ height: '1.5em' }}><Image className={'map-item-icon'} unoptimized alt='' height={0} width={0} src={'/vertigo_icon.webp'} style={{ height: '100%', width: 'auto' }} /></div><div>Vertigo</div></Link>
            <Link className="sidebar-link" href={'/train'}><div style={{ height: '1.5em' }}><Image className={'map-item-icon'} unoptimized alt='' height={0} width={0} src={'/train_icon.webp'} style={{ height: '100%', width: 'auto' }} /></div><div>Train</div></Link>

        </div>
    )
}

export default Sidebar;