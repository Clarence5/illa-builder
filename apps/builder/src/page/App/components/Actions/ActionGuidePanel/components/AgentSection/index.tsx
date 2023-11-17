import { Agent, getAIAgentMarketplaceInfo } from "@illa-public/market-agent"
import { FC, memo, useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useDispatch, useSelector } from "react-redux"
import { v4 } from "uuid"
import { Button, NextIcon, Skeleton, useMessage } from "@illa-design/react"
import { ActionGenerator } from "@/page/App/components/Actions/ActionGenerator"
import { INIT_ACTION_ADVANCED_CONFIG } from "@/page/App/components/Actions/AdvancedPanel/constant"
import { getAgentIcon } from "@/page/App/components/Actions/getIcon"
import { aiAgentActions } from "@/redux/aiAgent/dashboardTeamAIAgentSlice"
import { getIsILLAGuideMode } from "@/redux/config/configSelector"
import { configActions } from "@/redux/config/configSlice"
import { actionActions } from "@/redux/currentApp/action/actionSlice"
import {
  ActionContent,
  ActionItem,
  actionItemInitial,
} from "@/redux/currentApp/action/actionState"
import { AiAgentActionContent } from "@/redux/currentApp/action/aiAgentAction"
import { getInitialAgentContent } from "@/redux/currentApp/action/getInitialContent"
import { fetchCreateAction } from "@/services/action"
import { forkAIAgentToTeam } from "@/services/agent"
import { DisplayNameGenerator } from "@/utils/generators/generateDisplayName"
import { getRecommendAgentID } from "../../constans"
import { AgentPanelSectionProps } from "./interface"
import {
  basicButtonStyle,
  categoryItemContainerStyle,
  categoryTitleStyle,
  descStyle,
  headerContainerStyle,
  titleAndContentContainerStyle,
  titleStyle,
} from "./style"

const AgentPanelSection: FC<AgentPanelSectionProps> = (props) => {
  const { agents, title, hasMore, changeLoading } = props
  const { t } = useTranslation()
  const [generatorVisible, setGeneratorVisible] = useState<boolean>()
  const [recommendAgents, setRecommendAgents] = useState<Agent[]>([])
  const [isLoadingRecommendAgents, setIsLoadingRecommendAgents] =
    useState(false)

  const isGuideMode = useSelector(getIsILLAGuideMode)
  const dispatch = useDispatch()
  const message = useMessage()
  const filterAgents = agents.slice(0, 4)

  const handleClickAction = useCallback(
    (item: Agent, fromRecommend?: boolean) => {
      return async () => {
        if (fromRecommend) {
          const response = await forkAIAgentToTeam(item.aiAgentID)
          dispatch(
            aiAgentActions.addTeamAIAgentReducer({
              aiAgent: response.data,
            }),
          )
          item = response.data
        }
        const displayName = DisplayNameGenerator.generateDisplayName("aiagent")
        const initalAgentContent = getInitialAgentContent(item)
        const data: Omit<ActionItem<AiAgentActionContent>, "actionID"> = {
          actionType: "aiagent",
          displayName,
          resourceID: item.aiAgentID,
          content: {
            ...initalAgentContent,
            virtualResource: item,
          },
          isVirtualResource: true,
          ...actionItemInitial,
          config: {
            public: false,
            advancedConfig: INIT_ACTION_ADVANCED_CONFIG,
            icon: item.icon,
          },
        }
        if (isGuideMode) {
          const createActionData: ActionItem<ActionContent> = {
            ...data,
            actionID: v4(),
          }
          dispatch(actionActions.addActionItemReducer(createActionData))
          dispatch(configActions.changeSelectedAction(createActionData))
          return
        }
        changeLoading(true)
        try {
          const { data: responseData } = await fetchCreateAction(data)
          message.success({
            content: t("editor.action.action_list.message.success_created"),
          })
          dispatch(actionActions.addActionItemReducer(responseData))
          dispatch(configActions.changeSelectedAction(responseData))
        } catch (_e) {
          message.error({
            content: t("editor.action.action_list.message.failed"),
          })
          DisplayNameGenerator.removeDisplayName(displayName)
        } finally {
          changeLoading(false)
        }
      }
    },
    [changeLoading, dispatch, isGuideMode, message, t],
  )

  useEffect(() => {
    const abortController = new AbortController()
    if (filterAgents.length < 4) {
      const fetchMarketAgentList = async () => {
        setIsLoadingRecommendAgents(true)
        const needFetchAgentID = getRecommendAgentID().slice(
          filterAgents.length,
        )
        const needFetches = needFetchAgentID.map((id) =>
          getAIAgentMarketplaceInfo(id, abortController.signal),
        )
        Promise.all(needFetches)
          .then((res) => {
            const result = res.map((item) => item.data.aiAgent)
            setRecommendAgents(result)
          })
          .finally(() => setIsLoadingRecommendAgents(false))
      }
      fetchMarketAgentList()
    }

    return () => {
      abortController.abort()
      setIsLoadingRecommendAgents(false)
    }
  }, [filterAgents.length])

  return (
    <>
      <div css={headerContainerStyle}>
        <h6 css={categoryTitleStyle}>{title}</h6>
        {hasMore && (
          <Button
            colorScheme="techPurple"
            variant="text"
            rightIcon={<NextIcon />}
            onClick={() => setGeneratorVisible(true)}
          >
            {t("editor.action.panel.label.option.general.more")}
          </Button>
        )}
      </div>
      <section css={categoryItemContainerStyle}>
        {filterAgents.map((agent) => (
          <button
            css={basicButtonStyle}
            key={agent.aiAgentID}
            onClick={handleClickAction(agent)}
          >
            {getAgentIcon(agent, "32px")}
            <div css={titleAndContentContainerStyle}>
              <span css={titleStyle}>{agent.name}</span>
              <span css={descStyle}>{agent.description}</span>
            </div>
          </button>
        ))}
        {filterAgents.length < 4 &&
          (isLoadingRecommendAgents
            ? getRecommendAgentID()
                .slice(4 - filterAgents.length)
                .map((v) => (
                  <button css={basicButtonStyle} key={v}>
                    <Skeleton
                      text={false}
                      animation
                      image={{
                        shape: "square",
                        w: "100%",
                        h: "32px",
                        mr: "0 !important",
                      }}
                      h="32px"
                      w="100%"
                    />
                  </button>
                ))
            : recommendAgents.map((agent) => (
                <button
                  css={basicButtonStyle}
                  key={agent.aiAgentID}
                  onClick={handleClickAction(agent, true)}
                >
                  {getAgentIcon(agent, "32px")}
                  <div css={titleAndContentContainerStyle}>
                    <span css={titleStyle}>{agent.name}</span>
                    <span css={descStyle}>{agent.description}</span>
                  </div>
                </button>
              )))}
      </section>
      {generatorVisible && (
        <ActionGenerator
          visible={generatorVisible}
          onClose={() => setGeneratorVisible(false)}
          defaultStep="createAction"
          defaultActionType="aiagent"
          canBackToSelect={false}
        />
      )}
    </>
  )
}

export default memo(AgentPanelSection)
