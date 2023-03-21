import { get } from "lodash"
import { useSelector } from "react-redux"
import { Trigger } from "@illa-design/react"
import { PanelBar } from "@/components/PanelBar"
import {
  PanelConfig,
  PanelFieldConfig,
  PanelFieldGroupConfig,
} from "@/page/App/components/InspectPanel/interface"
import { Setter } from "@/page/App/components/InspectPanel/setter"
import { ghostEmptyStyle } from "@/page/App/components/InspectPanel/style"
import { getGuideStatus } from "@/redux/guide/guideSelector"

export const renderFieldAndLabel = (
  config: PanelFieldConfig,
  displayName: string,
  isInList: boolean = false,
  parentAttrName: string,
) => {
  const { id } = config
  return (
    <Setter
      key={`${id}-${displayName}`}
      {...config}
      isInList={isInList}
      parentAttrName={parentAttrName}
      displayName={displayName}
    />
  )
}

export const renderGuideModeFieldAndLabel = (
  config: PanelFieldConfig,
  displayName: string,
  isInList: boolean,
  parentAttrName: string,
) => {
  const { id } = config
  console.log("Trigger", id)
  return (
    <Trigger
      popupVisible={true}
      trigger={"hover"}
      content={"1111"}
      position="bottom"
      colorScheme="techPurple"
    >
      <div>
        {renderFieldAndLabel(config, displayName, isInList, parentAttrName)}
      </div>
    </Trigger>
  )
}

export const renderPanelBar = (
  config: PanelFieldGroupConfig,
  displayName: string,
  widgetProps: Record<string, any>,
) => {
  const { id, groupName, children } = config as PanelFieldGroupConfig
  const key = `${id}-${displayName}`
  return (
    <PanelBar key={key} title={groupName}>
      {children && children.length > 0 && (
        <div css={ghostEmptyStyle}>
          {fieldFactory(children, displayName, widgetProps)}
        </div>
      )}
    </PanelBar>
  )
}

export const canRenderField = (
  item: PanelFieldConfig,
  displayName: string,
  widgetProps: Record<string, any>,
) => {
  const { bindAttrName, shown } = item
  if (!bindAttrName || !shown) return true
  if (Array.isArray(bindAttrName)) {
    const values = bindAttrName.map((bindAttrNameItem) =>
      get(widgetProps, bindAttrNameItem),
    )
    return shown(...values)
  }

  return true
}

export const renderField = (
  item: PanelConfig,
  displayName: string,
  isInList: boolean = false,
  widgetProps: Record<string, any>,
) => {
  const isOpen = useSelector(getGuideStatus)
  const canRender = canRenderField(
    item as PanelFieldConfig,
    displayName,
    widgetProps,
  )
  if (!canRender) {
    return null
  }
  if ((item as PanelFieldGroupConfig).groupName) {
    return renderPanelBar(
      item as PanelFieldGroupConfig,
      displayName,
      widgetProps,
    )
  } else if ((item as PanelFieldConfig).setterType) {
    if (isOpen) {
      return renderGuideModeFieldAndLabel(
        item as PanelFieldConfig,
        displayName,
        isInList,
        "",
      )
    }
    return renderFieldAndLabel(
      item as PanelFieldConfig,
      displayName,
      isInList,
      "",
    )
  }
  return null
}

export function fieldFactory(
  panelConfig: PanelConfig[],
  displayName: string,
  widgetProps: Record<string, any>,
) {
  if (!displayName || !panelConfig || !panelConfig.length) return null
  return panelConfig.map((item: PanelConfig) =>
    renderField(item, displayName, false, widgetProps),
  )
}
