// Cloud Provider and Infrastructure Icons
import { Cloud, Server, Building2, Globe, Network, Box } from 'lucide-react'

// Cloud Provider SVG Icons
export const AWSIcon = ({ className, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color}>
    <path d="M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576.04.063.056.127.056.183 0 .08-.048.16-.152.24l-.503.335a.383.383 0 0 1-.208.072c-.08 0-.16-.04-.239-.112a2.47 2.47 0 0 1-.287-.375 6.18 6.18 0 0 1-.248-.471c-.622.734-1.405 1.101-2.347 1.101-.67 0-1.205-.191-1.596-.574-.391-.384-.59-.894-.59-1.533 0-.678.239-1.23.726-1.644.487-.415 1.133-.623 1.955-.623.272 0 .551.024.846.064.296.04.6.104.918.176v-.583c0-.607-.127-1.03-.375-1.277-.255-.248-.686-.367-1.3-.367-.28 0-.568.031-.863.103-.295.072-.583.16-.862.272a2.287 2.287 0 0 1-.28.104.488.488 0 0 1-.127.023c-.112 0-.168-.08-.168-.247v-.391c0-.128.016-.224.056-.28a.597.597 0 0 1 .224-.167c.279-.144.614-.264 1.005-.36a4.84 4.84 0 0 1 1.246-.151c.95 0 1.644.216 2.091.647.439.43.662 1.085.662 1.963v2.586zm-3.24 1.214c.263 0 .534-.048.822-.144.287-.096.543-.271.758-.51.128-.152.224-.32.272-.512.047-.191.08-.423.08-.694v-.335a6.66 6.66 0 0 0-.735-.136 6.02 6.02 0 0 0-.75-.048c-.535 0-.926.104-1.19.32-.263.215-.39.518-.39.917 0 .375.095.655.295.846.191.2.47.296.838.296zm6.41.862c-.144 0-.24-.024-.304-.08-.064-.048-.12-.16-.168-.311L7.586 5.55a1.398 1.398 0 0 1-.072-.32c0-.128.064-.2.191-.2h.783c.151 0 .255.025.31.08.065.048.113.16.16.312l1.342 5.284 1.245-5.284c.04-.16.088-.264.151-.312a.549.549 0 0 1 .32-.08h.638c.152 0 .256.025.32.08.063.048.12.16.151.312l1.261 5.348 1.381-5.348c.048-.16.104-.264.16-.312a.52.52 0 0 1 .311-.08h.743c.127 0 .2.065.2.2 0 .04-.009.08-.017.128a1.137 1.137 0 0 1-.056.2l-1.923 6.17c-.048.16-.104.263-.168.311a.51.51 0 0 1-.303.08h-.687c-.151 0-.255-.024-.32-.08-.063-.056-.119-.16-.15-.32l-1.238-5.148-1.23 5.14c-.04.16-.087.264-.15.32-.065.056-.177.08-.32.08zm10.256.215c-.415 0-.83-.048-1.229-.143-.399-.096-.71-.2-.918-.32-.128-.071-.215-.151-.247-.223a.563.563 0 0 1-.048-.224v-.407c0-.167.064-.247.183-.247.048 0 .096.008.144.024.048.016.12.048.2.08.271.12.566.215.878.279.319.064.63.096.95.096.502 0 .894-.088 1.165-.264a.86.86 0 0 0 .415-.758.777.777 0 0 0-.215-.559c-.144-.151-.415-.287-.807-.414l-1.157-.36c-.583-.183-1.014-.454-1.277-.813a1.902 1.902 0 0 1-.4-1.158c0-.335.073-.63.216-.886.144-.255.335-.479.575-.654.24-.184.51-.32.83-.415.32-.096.655-.136 1.006-.136.176 0 .359.008.535.032.183.024.35.056.518.088.16.04.312.08.455.127.144.048.256.096.336.144a.69.69 0 0 1 .24.2.43.43 0 0 1 .071.263v.375c0 .168-.064.256-.184.256a.83.83 0 0 1-.303-.096 3.652 3.652 0 0 0-1.532-.311c-.455 0-.815.071-1.062.223-.248.152-.375.383-.375.71 0 .224.08.416.24.567.159.152.454.304.877.44l1.134.358c.574.184.99.44 1.237.767.247.327.367.702.367 1.117 0 .343-.072.655-.207.926-.144.272-.336.511-.583.703-.248.2-.543.343-.886.447-.36.111-.734.167-1.142.167zM21.698 16.207c-2.626 1.94-6.442 2.969-9.722 2.969-4.598 0-8.74-1.7-11.87-4.526-.247-.223-.024-.527.27-.351 3.384 1.963 7.559 3.153 11.877 3.153 2.914 0 6.114-.607 9.06-1.852.439-.2.814.287.385.607zM22.792 14.961c-.336-.43-2.22-.207-3.074-.103-.255.032-.295-.192-.063-.36 1.5-1.053 3.967-.75 4.254-.399.287.36-.08 2.826-1.485 4.007-.215.184-.423.088-.327-.151.32-.79 1.03-2.57.695-2.994z"/>
  </svg>
)

export const AzureIcon = ({ className, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color}>
    <path d="M5.483 21.3H24L14.025 4.013l-3.038 8.347 5.836 6.938L5.483 21.3zM13.23 2.7L6.105 8.677 0 19.253h5.505l7.725-16.553z"/>
  </svg>
)

export const GCPIcon = ({ className, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color}>
    <path d="M12.19 2.38a9.344 9.344 0 0 0-9.234 6.893c.053-.02-.055.013 0 0-3.875 2.551-3.922 8.11-.247 10.941l.006-.007-.007.03a6.717 6.717 0 0 0 4.077 1.356h5.173l.03.03h5.192a6.506 6.506 0 0 0 5.6-5.669 6.662 6.662 0 0 0-1.384-5.283h.036l-.005-.009a6.652 6.652 0 0 0-4.395-2.502 9.347 9.347 0 0 0-4.842-5.78zm.287 2.37c1.665.013 3.25.77 4.388 2.058a5.234 5.234 0 0 1 1.172 2.15l.091.34.33.114a5.23 5.23 0 0 1 3.214 2.591 5.246 5.246 0 0 1 .461 3.756 5.085 5.085 0 0 1-4.379 3.763H6.786a5.318 5.318 0 0 1-3.214-1.071 5.302 5.302 0 0 1-1.919-2.741 5.258 5.258 0 0 1 1.446-5.158l.215-.193.057-.259a7.962 7.962 0 0 1 9.106-5.35z"/>
  </svg>
)

export const DigitalOceanIcon = ({ className, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color}>
    <path d="M12.04 0C5.408-.02.005 5.37.005 11.992h4.638c0-4.923 4.882-8.731 10.064-6.855a6.95 6.95 0 0 1 4.147 4.148c1.889 5.177-1.924 10.055-6.84 10.064v-4.61H7.391v4.623h4.61V24c7.86 0 13.967-7.588 11.397-15.83-1.115-3.57-3.988-6.444-7.557-7.56A12.098 12.098 0 0 0 12.039 0zM7.39 19.362H3.828v3.564H7.39zm-3.563 0v-2.978H.85v2.978z"/>
  </svg>
)

export const HerokuIcon = ({ className, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color}>
    <path d="M20.61 0H3.39C2.189 0 1.23.96 1.23 2.16v19.68c0 1.2.959 2.16 2.16 2.16h17.22c1.2 0 2.159-.96 2.159-2.16V2.16C22.77.96 21.811 0 20.61 0zm.96 21.84c0 .539-.421.96-.96.96H3.39c-.54 0-.96-.421-.96-.96V2.16c0-.54.42-.96.96-.96h17.22c.539 0 .96.42.96.96v19.68zM6.63 20.4l3.24-2.58 3.24 2.58V3.6h-6.48v16.8zm9.66-16.8v5.04c.03.09.101.109.189.03l1.14-1.17 1.14 1.17c.09.079.161.06.181-.03V3.6h-2.64z"/>
  </svg>
)

export const LinodeIcon = ({ className, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" className={className} fill={color}>
    <path d="M12.052 0L.365 7.65l3.28 1.974 8.406-5.076L20.476 9.6l3.16-1.95L12.053 0zM3.65 10.327L.365 12.3l11.687 7.2 11.583-7.2-3.16-1.95-8.424 5.076-8.4-5.1zm0 4.95l-3.285 1.974 11.687 7.2 11.583-7.2-3.16-1.95-8.424 5.077-8.4-5.1z"/>
  </svg>
)

// Infrastructure type icons mapping
export const INFRASTRUCTURE_ICONS = {
  aws: { icon: AWSIcon, color: '#FF9900', name: 'AWS' },
  azure: { icon: AzureIcon, color: '#0089D6', name: 'Azure' },
  gcp: { icon: GCPIcon, color: '#4285F4', name: 'Google Cloud' },
  digitalocean: { icon: DigitalOceanIcon, color: '#0080FF', name: 'DigitalOcean' },
  heroku: { icon: HerokuIcon, color: '#430098', name: 'Heroku' },
  linode: { icon: LinodeIcon, color: '#00A95C', name: 'Linode' },
  onpremise: { icon: Building2, color: '#6B7280', name: 'On-Premise' },
  internal: { icon: Network, color: '#8B5CF6', name: 'Internal' },
  external: { icon: Globe, color: '#10B981', name: 'External' },
  datacenter: { icon: Server, color: '#3B82F6', name: 'Data Center' },
  kubernetes: { icon: Box, color: '#326CE5', name: 'Kubernetes' },
  other: { icon: Cloud, color: '#6B7280', name: 'Other' }
}

// Get infrastructure icon component
export const getInfrastructureIcon = (type) => {
  return INFRASTRUCTURE_ICONS[type?.toLowerCase()] || INFRASTRUCTURE_ICONS.other
}

// Infrastructure Icon Component
const InfrastructureIcon = ({ type, size = 'md', showLabel = false, className = '' }) => {
  const config = getInfrastructureIcon(type)
  const IconComponent = config.icon

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} flex items-center justify-center`}
        style={{ color: config.color }}
      >
        <IconComponent className="w-full h-full" color={config.color} />
      </div>
      {showLabel && (
        <span className="text-sm text-[var(--text-secondary)]">{config.name}</span>
      )}
    </div>
  )
}

// Infrastructure Selector Component
export const InfrastructureSelector = ({ value, onChange, showLabel = true }) => {
  return (
    <div className="space-y-2">
      {showLabel && (
        <label className="text-sm font-medium text-[var(--text-secondary)]">Infrastructure</label>
      )}
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(INFRASTRUCTURE_ICONS).map(([key, config]) => {
          const IconComponent = config.icon
          const isSelected = value === key
          
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border-color)] hover:border-[var(--text-tertiary)]'
              }`}
              title={config.name}
            >
              <IconComponent 
                className="w-6 h-6" 
                color={isSelected ? config.color : 'var(--text-tertiary)'} 
              />
              <span className={`text-[10px] truncate w-full text-center ${
                isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
              }`}>
                {config.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default InfrastructureIcon

