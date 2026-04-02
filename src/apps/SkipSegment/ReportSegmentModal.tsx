import {FC, useState} from "react";
import {BvId, ChapterId} from "../../types/global";
import {postSegments, RedundantType, RedundantTypeConfig, redundantTypeConfig, Segment} from "../../utils/video.ts";
import { useForm } from "antd/es/form/Form";
import {Form, message, Modal, Radio, Tooltip} from "antd/es";
import {getHashBySHA256} from "../../utils/crypto.ts";
import {formatTime} from "../../utils/common.ts";
import bilibot from "../../assets/bilibot.svg"
import FormItem from "antd/es/form/FormItem";

interface ReportSegmentProps {
    userId: number,
    bvId: BvId,
    chapterId: ChapterId,
    videoDuration: number,
    startTime: number,
    endTime: number,
    handleChangeStartTime: (reset?: boolean) => void,
    handleChangeEndTime: (reset?: boolean) => void,
    container: HTMLDivElement,
    updateSegments: (newSegment: Segment) => void
}

const reportCategoryOptions = (Object.entries(redundantTypeConfig) as [RedundantType, RedundantTypeConfig][])
                                .filter(entry => {
                                    return ![RedundantType.FULL, RedundantType.UNKNOWN, RedundantType.PADDING].includes(entry[0])
                                })
                                .map(([k, v]) => {
                                    return {
                                        label: (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className='segment-category-label' style={{ backgroundColor: v.color }}/>
                                                <span>{v.name}</span>
                                            </div>
                                        ),
                                        value: k,
                                    }
                                })

const ReportSegmentModal: FC<ReportSegmentProps> = (props) => {
    const [modalOpen, setModalOpen] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [reportForm] = useForm()

    const reset = () => {
        setModalOpen(false)
        props.handleChangeStartTime(true)
        props.handleChangeEndTime(true)
        reportForm.resetFields()
    }
    const reportSegments = async () => {
        if (props.endTime - props.startTime < 10) {
            message.error('片段时长至少10s')
            return
        }
        try {
            setLoading(true)
            const userId = await getHashBySHA256(String(props.userId))
            const redundantType = reportForm.getFieldValue('category') as RedundantType
            const result = await postSegments({
                videoID: props.bvId,
                cid: String(props.chapterId),
                userID: userId,
                userAgent: window.navigator.userAgent,
                videoDuration: props.videoDuration,
                segments: [
                    {
                        segment: [props.startTime, props.endTime],
                        actionType: 'skip',
                        category: redundantType
                    }
                ]
            })
            if (result) {
                console.log(`[BC] reported segment ${props.bvId} ${props.chapterId} ${formatTime(props.startTime)} - ${formatTime(props.endTime)}`)
                message.success('上报片段成功')
                reset()
                // update segment bar
                props.updateSegments({
                    start: props.startTime,
                    end: props.endTime,
                    redundantType: redundantType,
                    opacity: redundantTypeConfig[redundantType].opacity,
                    color: redundantTypeConfig[redundantType].color,
                    skip: true
                })
            } else {
                console.error(`[BC] report segment ${props.bvId} ${props.chapterId} ${formatTime(props.startTime)} - ${formatTime(props.endTime)} failed, returned false`)
                message.error('上报分段失败')
            }
        } catch (e) {
            console.error(`[BC] report segment ${props.bvId} ${props.chapterId} ${formatTime(props.startTime)} - ${formatTime(props.endTime)} failed, ${e}`)
        } finally {
            setLoading(false)
        }

    }

    return <>
        {/* report button */}
        <div
            id='report-segment-button'
            className='report-segment-button'
            onClick={() => {
                if (props.startTime) {
                    props.handleChangeEndTime()
                    setModalOpen(true)
                } else {
                    props.handleChangeStartTime()
                }
            }}
        >
            <img src={bilibot} alt='bilibot' className='report-segment-button-icon'/>
            <Tooltip title={
                <>
                    1.首次点击将当前时间记为片段起点<br/>
                    2.再次点击记录终点并打开弹窗<br/>
                </>
            }>
                <span
                    style={{
                        fontSize: '14px',
                        color: '#00AEEC',
                    }}
                >
                    {
                        props.startTime
                            ? props.endTime
                                ? '记录片段终点'
                                : '记录片段终点'
                            : '记录片段起点'
                    }

                </span>
            </Tooltip>
            <div className='report-segment-button-border'/>
        </div>
        {/* report modal */}
        <Modal
            className='report-segment-modal'
            title='仅支持标记为跳过'
            open={modalOpen}
            closable={false}
            cancelText='重置'
            onCancel={reset}
            cancelButtonProps={{
                loading: loading
            }}
            okText='提交'
            onOk={reportSegments}
            okButtonProps={{
                loading: loading
            }}
            width='20vw'
            mask={{
                closable: false,
                blur: true,
            }}
            getContainer={props.container}
            centered={true}
        >
            <Form
                form={reportForm}
                initialValues={{category: reportCategoryOptions[0].value}}
                style={{
                    paddingTop: '1em'
                }}
            >
                <FormItem
                    label='时间范围'
                >
                    <span>{`${formatTime(props.startTime)} -> ${formatTime(props.endTime)}`}</span>
                </FormItem>
                <FormItem
                    label='片段类型'
                    name='category'
                    required={true}
                    style={{marginBottom: '12px'}}
                >
                    <Radio.Group options={reportCategoryOptions}/>
                </FormItem>
            </Form>
        </Modal>
    </>
}

export default ReportSegmentModal