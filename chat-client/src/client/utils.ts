import { MynahIcons } from '@aws/mynah-ui'

export function mapToMynahIcon(icon: string | undefined): MynahIcons | undefined {
    return icon && Object.values<string>(MynahIcons).includes(icon) ? (icon as MynahIcons) : undefined
}
